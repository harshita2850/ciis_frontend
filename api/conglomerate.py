from reddit_fetch import scrape_reddit_data, fetch_user_activity, reddit
from llm_verification import run_openai_verification_df
from sentiment_verification import anti_india_score
from anti_india_user import get_anti_india_comment_users
import pandas as pd 
import numpy as np
import os
from datetime import datetime


def fetch_multiple_users_activity(usernames, num_posts=5, num_comments=5, reddit_instance=reddit):
    """
    Fetch activity for multiple users and combine into single DataFrame
    """
    all_data = []

    for username in usernames:
        print(f"\n🔍 Fetching activity for user: {username}...")
        try:
            user_df = fetch_user_activity(username, num_posts, num_comments, reddit_instance)
            if not user_df.empty:
                all_data.append(user_df)
            else:
                print(f"ℹ️ No activity found for {username}")
        except Exception as e:
            print(f"⚠️ Failed to fetch data for user {username}: {e}")

    if all_data:
        return pd.concat(all_data, ignore_index=True)
    else:
        return pd.DataFrame(columns=[
            "Target_User", "Post_Title", "Post_URL", "Post_Author", "Post_Score",
            "Post_Comments_Count", "Post_DateTime", "Comment_Author", "Comment_Body",
            "Comment_Score", "Comment_DateTime"
        ])



def score_loop( df ): 
    
    # Check if DataFrame is empty
    if df.empty:
        # Return empty DataFrame with required columns
        empty_df = pd.DataFrame()
        empty_df['OpenAI_Label_Post'] = []
        empty_df['OpenAI_Label_Comment'] = []
        return empty_df
    
    #Apply scoring
    df['Post_Anti_India_Score'] = df['Post_Title'].apply(anti_india_score)
    df['Comment_Anti_India_Score'] = df['Comment_Body'].fillna(value= "empty").apply(anti_india_score)
    
    # Create combined Anti_India_Score for candidate filtering
    df['Anti_India_Score'] = df[['Post_Anti_India_Score', 'Comment_Anti_India_Score']].max(axis=1)
    # Assuming your df already has 'Post_Title', 'Comment_Body', 'Anti_India_Score'
    df_verified = run_openai_verification_df(df, threshold=0.5, batch_size=20)
    print("OpenAI DDone")
    # Ensure OpenAI columns exist (in case run_openai_verification_df doesn't create them)
    return df_verified
    

def keyword_search(keywords , num_posts=10 , num_comments=10 ):
    df = scrape_reddit_data(
        csv_file="reddit_scraped.csv",
        num_posts=num_posts,
        num_comments=num_comments,
        keywords=keywords,
    )
    
    result_df = score_loop(df)
    print("Score Loop Done")
    # Check if OpenAI_Label_Comment column exists before calling get_anti_india_comment_users
    anti_user = []
    if 'OpenAI_Label_Comment' in result_df.columns:
        anti_user = get_anti_india_comment_users(result_df)
        print(anti_user)

    if len(anti_user) > 0:
        user_df = fetch_multiple_users_activity(anti_user)
        user_res = score_loop(user_df)
        print("Anti User Entered")
        # Count rows where OpenAI labels are 1 for each unique user
        openai_counts = user_res.groupby('Target_User').agg({
            'OpenAI_Label_Post': 'sum',
            'OpenAI_Label_Comment': 'sum'
        }).reset_index()
        print(openai_counts)
        openai_counts['Total_OpenAI_Flagged'] = openai_counts['OpenAI_Label_Post'] + openai_counts['OpenAI_Label_Comment']
        
        # Filter users with flagged content (Total_OpenAI_Flagged > 0)
        flagged_users = openai_counts[openai_counts['Total_OpenAI_Flagged'] > 0]['Target_User'].tolist()
        print("User Analysis Done")
        if len(flagged_users) > 0:
            print("Returning result with flagged users")
            # Ensure both DataFrames don't have problematic values
            result_df = result_df.replace([float('inf'), float('-inf')], None)
            result_df = result_df.fillna(value=np.nan)
            user_res = user_res.replace([float('inf'), float('-inf')], None)
            user_res = user_res.fillna(value=np.nan)
            return result_df, flagged_users, user_res
        else:
            print("Returning result without flagged users")
            # Ensure both DataFrames don't have problematic values
            result_df = result_df.replace([float('inf'), float('-inf')], None)
            result_df = result_df.fillna(value=np.nan)
            user_res = user_res.replace([float('inf'), float('-inf')], None)
            user_res = user_res.fillna(value=np.nan)
            return result_df, "No users found with flagged content", user_res
    else:
        print("Returning result - no anti-India users detected")
        # Ensure result_df doesn't have problematic values
        result_df = result_df.replace([float('inf'), float('-inf')], None)
        result_df = result_df.fillna(value=np.nan)
        return result_df, "No anti-India users detected in the initial screening", pd.DataFrame()





def bulk_user_analysis(user_ids, batch_size=10):
    """
    Analyze users in batches to handle large lists efficiently
    
    Args:
        user_ids (list): List of user IDs/usernames to analyze
        batch_size (int): Number of users to process in each batch
    
    Returns:
        tuple: (combined_result_df, all_flagged_users_or_message, user_data_df)
    """
    if not user_ids or len(user_ids) == 0:
        return pd.DataFrame(), "No user IDs provided"
    
    all_results = []
    all_flagged_users = []
    
    # Process users in batches
    for i in range(0, len(user_ids), batch_size):
        batch = user_ids[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}: {len(batch)} users")
        
        result_df, flagged_users, user_data_df = user_id_search(batch)
        
        if not result_df.empty:
            all_results.append(result_df)
        
        if isinstance(flagged_users, list):
            all_flagged_users.extend(flagged_users)
    
    # Combine all results
    if all_results:
        combined_df = pd.concat(all_results, ignore_index=True)
    else:
        combined_df = pd.DataFrame()
    
    if len(all_flagged_users) > 0:
        # Remove duplicates while preserving order
        unique_flagged_users = list(dict.fromkeys(all_flagged_users))
        return combined_df, unique_flagged_users, combined_df  # Return combined_df as user data
    else:
        if combined_df.empty:
            return combined_df, "No data found for any of the provided user IDs", pd.DataFrame()
        else:
            return combined_df, "No flagged content found for any of the provided users", combined_df

def user_id_search(user_ids):
    """
    Search and analyze specific user IDs for anti-India content
    
    Args:
        user_ids (list): List of user IDs/usernames to analyze
    
    Returns:
        tuple: (result_df, flagged_users_or_message, user_data_df)
    """
    if not user_ids or len(user_ids) == 0:
        return pd.DataFrame(), "No user IDs provided"
    
    try:
        # Fetch user activity data
        user_df = fetch_multiple_users_activity(user_ids)
        
        if user_df.empty:
            return pd.DataFrame(), "No data found for the provided user IDs"
        
        # Apply scoring and verification
        result_df = score_loop(user_df)
        
        # Count rows where OpenAI labels are 1 for each unique user
        openai_counts = result_df.groupby('Target_User').agg({
            'OpenAI_Label_Post': 'sum',
            'OpenAI_Label_Comment': 'sum'
        }).reset_index()

        openai_counts['Total_OpenAI_Flagged'] = openai_counts['OpenAI_Label_Post'] + openai_counts['OpenAI_Label_Comment']
        
        # Filter users with flagged content (Total_OpenAI_Flagged > 0)
        flagged_users = openai_counts[openai_counts['Total_OpenAI_Flagged'] > 0]['Target_User'].tolist()
        
        if len(flagged_users) > 0:
            return result_df, flagged_users, result_df  # Return result_df as user data
        else:
            return result_df, "No users found with flagged content", result_df
            
    except Exception as e:
        return pd.DataFrame(), f"Error processing user IDs: {str(e)}", pd.DataFrame()


def save_keyword_search_to_csv(keywords, num_posts=10, num_comments=10, base_dir="data"):
    """
    Run keyword search and save results to CSV files with timestamp
    
    Args:
        keywords (list): List of keywords to search for
        num_posts (int): Number of posts to fetch
        num_comments (int): Number of comments to fetch
        base_dir (str): Base directory to save CSV files
    
    Returns:
        tuple: (success_status, message, file_paths)
    """
    try:
        # Create data directory if it doesn't exist
        os.makedirs(base_dir, exist_ok=True)
        
        # Run keyword search
        result_df, flagged_users, user_activity_df = keyword_search(keywords, num_posts, num_comments)
        
        # Generate timestamp for file naming
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Define file paths
        reddit_activity_file = os.path.join(base_dir, f"reddit_activity_{timestamp}.csv")
        user_activity_file = os.path.join(base_dir, f"user_activity_{timestamp}.csv")
        
        # Save DataFrames to CSV
        if not result_df.empty:
            result_df.to_csv(reddit_activity_file, index=False)
            print(f"Reddit activity saved to: {reddit_activity_file}")
        else:
            result_df.to_csv(reddit_activity_file, index=False)  # Save empty CSV with headers
            print(f"Empty reddit activity saved to: {reddit_activity_file}")
        
        if not user_activity_df.empty:
            user_activity_df.to_csv(user_activity_file, index=False)
            print(f"User activity saved to: {user_activity_file}")
        else:
            user_activity_df.to_csv(user_activity_file, index=False)  # Save empty CSV with headers
            print(f"Empty user activity saved to: {user_activity_file}")
        
        return True, "Data saved successfully", {
            "reddit_activity_file": reddit_activity_file,
            "user_activity_file": user_activity_file,
            "timestamp": timestamp,
            "flagged_users": flagged_users,
            "reddit_records": len(result_df),
            "user_records": len(user_activity_df)
        }
        
    except Exception as e:
        error_msg = f"Error saving keyword search data: {str(e)}"
        print(error_msg)
        return False, error_msg, {}


def get_latest_saved_data(base_dir="data"):
    """
    Get the latest saved CSV files and return their data
    
    Args:
        base_dir (str): Base directory where CSV files are stored
    
    Returns:
        tuple: (reddit_data, user_data, file_info)
    """
    try:
        if not os.path.exists(base_dir):
            return [], [], {"message": "No data directory found"}
        
        # Get all CSV files
        reddit_files = [f for f in os.listdir(base_dir) if f.startswith("reddit_activity_") and f.endswith(".csv")]
        user_files = [f for f in os.listdir(base_dir) if f.startswith("user_activity_") and f.endswith(".csv")]
        
        if not reddit_files and not user_files:
            return [], [], {"message": "No saved data files found"}
        
        # Get latest files
        latest_reddit_file = max(reddit_files) if reddit_files else None
        latest_user_file = max(user_files) if user_files else None
        
        reddit_data = []
        user_data = []
        
        if latest_reddit_file:
            reddit_df = pd.read_csv(os.path.join(base_dir, latest_reddit_file))
            reddit_data = reddit_df.to_dict(orient="records")
        
        if latest_user_file:
            user_df = pd.read_csv(os.path.join(base_dir, latest_user_file))
            user_data = user_df.to_dict(orient="records")
        
        file_info = {
            "latest_reddit_file": latest_reddit_file,
            "latest_user_file": latest_user_file,
            "reddit_records": len(reddit_data),
            "user_records": len(user_data),
            "last_updated": max([latest_reddit_file, latest_user_file]) if latest_reddit_file and latest_user_file else (latest_reddit_file or latest_user_file)
        }
        
        return reddit_data, user_data, file_info
        
    except Exception as e:
        error_msg = f"Error loading saved data: {str(e)}"
        print(error_msg)
        return [], [], {"error": error_msg}

