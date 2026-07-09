import pandas as pd
import re
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Initialize VADER globally
sia = SentimentIntensityAnalyzer()

# Define global VADER sentiment function
def vader_sentiment(text):
    if pd.isna(text) or str(text).strip() == "":
        return "neutral", 0
    score = sia.polarity_scores(text)
    compound = score['compound']
    if compound >= 0.30:
        return "positive", compound
    elif compound <= -0.50:
        return "negative", compound
    else:
        return "neutral", compound

# Keyword list
keywords = ["anti-India", "undermine India", "sabotage India", "against India",
            "bomb India", "kill India", "destroy India", "terrorist", "terror",
            "attack India", "India is bad", "India is evil", "India is a threat",
            "India is dangerous", "Pakistan is great", "Pakistan over India"]

# Keyword distance scoring
def keyword_distance_score(text, keywords):
    text_lower = text.lower()
    positions = []
    for kw in keywords:
        for match in re.finditer(re.escape(kw.lower()), text_lower):
            positions.append(match.start())
    if not positions:
        return 0
    # The closer the keywords are to the start of the text, the higher the score
    score = max(0, 1 - min(positions)/len(text_lower))
    return score

# Anti-India combined score
def anti_india_score(text):
    sentiment, compound = vader_sentiment(text)
    kw_score = keyword_distance_score(text, keywords)
    if sentiment == 'negative':
        score = 0.6 * abs(compound) + 0.4 * kw_score  #0.4 0.6 
    else:
        score = 0.4 * kw_score
    return score


