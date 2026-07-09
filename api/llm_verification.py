import re
import json
import pandas as pd
from openai import OpenAI
import os
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variables
openai_api_key = os.getenv("OPEN_AI_KEY")
client = OpenAI(api_key=openai_api_key)

# ---- OpenAI batch verification function ----
def openai_batch_verify_posts_comments(df, batch_size=20, model="gpt-4o-mini"):
    texts = []

    # Collect post + comment texts
    for _, row in df.iterrows():
        texts.append(f"POST: {row['Post_Title']}")
        if pd.notna(row['Comment_Body']) and row['Comment_Body'].strip():
            texts.append(f"COMMENT: {row['Comment_Body']}")

    results = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]

        prompt = f"""
You are a strict binary classifier.
For each of the following {len(batch)} texts, classify:
- 1 = contains anti-India or anti-national hate
- 0 = otherwise

Return ONLY a JSON array of {len(batch)} numbers. Example: [0, 1, 0, 0]

Texts:
{json.dumps(batch)}
        """

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a strict JSON classifier. Always return valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_completion_tokens=500
        )

        output_text = response.choices[0].message.content.strip()

        # Extract JSON array
        match = re.search(r"\[.*\]", output_text, re.DOTALL)
        if match:
            try:
                batch_results = json.loads(match.group())
            except Exception:
                print("⚠️ JSON parse failed:", match.group())
                batch_results = [0] * len(batch)
        else:
            print("⚠️ No JSON found in response:", output_text)
            batch_results = [0] * len(batch)

        # Fix length mismatch
        if len(batch_results) != len(batch):
            if len(batch_results) < len(batch):
                batch_results.extend([0] * (len(batch) - len(batch_results)))
            else:
                batch_results = batch_results[:len(batch)]

        results.extend(batch_results)

    # Split results back into two columns
    post_labels, comment_labels = [], []
    idx = 0
    for _, row in df.iterrows():
        post_labels.append(results[idx]); idx += 1
        if pd.notna(row['Comment_Body']) and row['Comment_Body'].strip():
            comment_labels.append(results[idx]); idx += 1
        else:
            comment_labels.append(0)

    df["OpenAI_Label_Post"] = post_labels
    df["OpenAI_Label_Comment"] = comment_labels

    return df


# ---- Candidate filtering + verification on DataFrame ----
def run_openai_verification_df(df, threshold=0.5, batch_size=20, model="gpt-4o-mini"):
    candidate_posts = df[df['Anti_India_Score'] > threshold].copy()
    print(f"🔍 Found {len(candidate_posts)} candidate rows to verify with OpenAI...")

    if len(candidate_posts) > 0:
        candidate_posts = openai_batch_verify_posts_comments(candidate_posts, batch_size=batch_size, model=model)

        # Merge back into original dataframe
        df = df.merge(
            candidate_posts[['Post_Title', 'Comment_Body', 'OpenAI_Label_Post', 'OpenAI_Label_Comment']],
            on=['Post_Title', 'Comment_Body'],
            how='left'
        )

        df['OpenAI_Label_Post'] = df['OpenAI_Label_Post'].fillna(0).astype(int)
        df['OpenAI_Label_Comment'] = df['OpenAI_Label_Comment'].fillna(0).astype(int)
    else:
        df["OpenAI_Label_Post"] = 0
        df["OpenAI_Label_Comment"] = 0
        df["OpenAI_Label_Comment"] = 0

    return df
