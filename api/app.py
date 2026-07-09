from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union, Dict, Any
import pandas as pd
import numpy as np
from conglomerate import keyword_search, bulk_user_analysis, user_id_search
import asyncio
from datetime import datetime, time as dt_time
import threading
import time

from typing import List, Dict, Any

app = FastAPI(title="Anti-India Content Analysis API", version="1.0.0")

# Add CORS middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class KeywordSearchRequest(BaseModel):
    keywords: List[str]
    num_posts: int = 10 
    num_comments :int = 10 

class UserSearchRequest(BaseModel):
    user_ids: List[str]
    batch_size: int = 10

class UserIDSearchRequest(BaseModel):
    user_ids: List[str]

# Global variables for scheduled task
scheduled_keywords = ["article370" , "bomb India" , "Free Kashmir"]

def run_scheduled_search():
    """Simple function to run the search and save to CSV"""
    try:
        print(f"Running scheduled search at {datetime.now()}")
        result_df, flagged_users, user_activity_df = keyword_search(scheduled_keywords, 10, 10)
        
        # Save to CSV files with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        result_df.to_csv(f"reddit_activity_{timestamp}.csv", index=False)
        user_activity_df.to_csv(f"user_activity_{timestamp}.csv", index=False)
        
        print(f"Data saved to reddit_activity_{timestamp}.csv and user_activity_{timestamp}.csv")
        return True
    except Exception as e:
        print(f"Error in scheduled search: {e}")
        return False

def schedule_checker():
    """Check every minute if it's time to run the search"""
    while True:
        now = datetime.now()
        # Run at :00 and :30 minutes of every hour
        if now.minute in [0, 30] and now.second == 0:
            run_scheduled_search()
            time.sleep(1)  # Prevent running multiple times in the same second
        time.sleep(1)  # Check every second

# Start the scheduler in a background thread
scheduler_thread = threading.Thread(target=schedule_checker, daemon=True)
scheduler_thread.start()
def dataframe_to_json(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Convert DataFrame to JSON format where each row becomes an object
    with column names as parameters
    """
    if df.empty:
        return []
    
    # Step 1: Replace inf / -inf with NaN
    df_clean = df.replace([np.inf, -np.inf], np.nan)

    # Step 2: Convert all NaN/NA/NaT to None
    df_clean = df_clean.where(pd.notnull(df_clean), None)

    # Step 3: Convert DataFrame to list of dictionaries
    records = df_clean.to_dict(orient="records")

    # Step 4: Ensure no leftover NaN sneaks in
    # (double safety: Python json.dumps will fail otherwise)
    def sanitize(obj):
        if isinstance(obj, float) and (np.isnan(obj) or obj in [np.inf, -np.inf]):
            return None
        return obj

    sanitized_records = [
        {k: sanitize(v) for k, v in row.items()}
        for row in records
    ]

    return sanitized_records


def get_latest_csv_data():
    """Get the latest CSV files and return their data as DataFrames"""
    import os
    import glob
    
    try:
        # Get all reddit and user activity CSV files
        reddit_files = glob.glob("reddit_activity_*.csv")
        user_files = glob.glob("user_activity_*.csv")
        
        if not reddit_files and not user_files:
            return pd.DataFrame(), pd.DataFrame(), "No data files found"
        
        # Get the latest files (sort by filename which includes timestamp)
        latest_reddit_file = max(reddit_files) if reddit_files else None
        latest_user_file = max(user_files) if user_files else None
        
        reddit_df = pd.DataFrame()
        user_df = pd.DataFrame()
        
        if latest_reddit_file:
            try:
                reddit_df = pd.read_csv(latest_reddit_file)
            except Exception as e:
                print(f"Error reading {latest_reddit_file}: {e}")
        
        if latest_user_file:
            try:
                user_df = pd.read_csv(latest_user_file)
            except Exception as e:
                print(f"Error reading {latest_user_file}: {e}")
        
        return reddit_df, user_df, f"Latest files: {latest_reddit_file}, {latest_user_file}"
        
    except Exception as e:
        return pd.DataFrame(), pd.DataFrame(), f"Error reading CSV files: {str(e)}"


@app.get("/")
async def root():
    return {"message": "Anti-India Content Analysis API", "version": "1.0.0"}

@app.post("/search/keywords")
async def search_by_keywords(request: KeywordSearchRequest):
    """
    Search for anti-India content based on keywords
    
    Returns:
    - result_data: List of objects where each object represents a row from the result DataFrame
    - flagged_users: List of flagged users or message if none found
    - user_activity_data: List of objects representing user activity data (posts/comments)
    """
    try:
        result_df, flagged_users, user_activity_df = keyword_search(request.keywords , request.num_comments , request.num_posts)
        
        # Convert DataFrames to JSON format
        result_data = dataframe_to_json(result_df)
        user_activity_data = dataframe_to_json(user_activity_df)
        
        return {
            "status": "success",
            "keywords_searched": request.keywords,
            "total_records": len(result_data),
            "result_data": result_data,
            "flagged_users": flagged_users,
            "user_activity_data": user_activity_data,
            "user_activity_records": len(user_activity_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing keyword search: {str(e)}")

@app.post("/search/users/bulk")
async def bulk_user_search(request: UserSearchRequest):
    """
    Analyze multiple users in batches for anti-India content
    
    Returns:
    - result_data: List of objects where each object represents a row from the combined result DataFrame
    - flagged_users: List of all flagged users across batches or message if none found
    - user_activity_data: List of objects representing user activity data (posts/comments)
    """
    try:
        result_df, flagged_users, user_activity_df = bulk_user_analysis(request.user_ids, request.batch_size)
        
        # Convert DataFrames to JSON format
        result_data = dataframe_to_json(result_df)
        user_activity_data = dataframe_to_json(user_activity_df)
        
        return {
            "status": "success",
            "users_analyzed": len(request.user_ids),
            "batch_size": request.batch_size,
            "total_records": len(result_data),
            "result_data": result_data,
            "flagged_users": flagged_users,
            "user_activity_data": user_activity_data,
            "user_activity_records": len(user_activity_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing bulk user analysis: {str(e)}")

@app.post("/search/users")
async def search_users(request: UserIDSearchRequest):
    """
    Search and analyze specific user IDs for anti-India content
    
    Returns:
    - result_data: List of objects where each object represents a row from the result DataFrame
    - flagged_users: List of flagged users or message if none found
    - user_activity_data: List of objects representing user activity data (posts/comments)
    """
    try:
        result_df, flagged_users, user_activity_df = user_id_search(request.user_ids)
        
        # Convert DataFrames to JSON format
        result_data = dataframe_to_json(result_df)
        user_activity_data = dataframe_to_json(user_activity_df)
        
        return {
            "status": "success",
            "users_searched": request.user_ids,
            "total_records": len(result_data),
            "result_data": result_data,
            "flagged_users": flagged_users,
            "user_activity_data": user_activity_data,
            "user_activity_records": len(user_activity_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing user search: {str(e)}")

@app.get("/search/scheduled/data")
async def get_scheduled_data():
    """
    Get the latest data from the automatic scheduled searches
    
    Returns the most recent reddit_activity.csv and user_activity.csv data
    """
    try:
        reddit_df, user_df, message = get_latest_csv_data()
        
        # Convert DataFrames to JSON format (same as other endpoints)
        reddit_data = dataframe_to_json(reddit_df)
        user_data = dataframe_to_json(user_df)
        
        return {
            "status": "success",
            "message": message,
            "total_records": len(reddit_data),
            "result_data": reddit_data,
            "user_activity_data": user_data,
            "user_activity_records": len(user_data),
            "info": "Data is automatically updated every 30 minutes at :00 and :30"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving scheduled data: {str(e)}")

@app.get("/search/scheduled/run-once")
async def run_scheduled_search_once():
    """
    Manually run the scheduled search once to create initial CSV files
    """
    try:
        success = run_scheduled_search()
        
        if success:
            return {
                "status": "success",
                "message": "Scheduled search executed successfully",
                "info": "Initial CSV files have been created"
            }
        else:
            return {
                "status": "error",
                "message": "Scheduled search failed",
                "info": "Check the logs for error details"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running scheduled search: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Anti-India Content Analysis API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)