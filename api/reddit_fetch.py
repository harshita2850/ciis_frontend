import praw
import pandas as pd
from datetime import datetime

from dotenv import load_dotenv
import os
load_dotenv()
client_id = os.getenv("REDDIT_USER_KEY")
client_secret = os.getenv("REDDIT_KEY")
reddit = praw.Reddit(
    client_id=client_id,
    client_secret=client_secret,
    user_agent="anti_india_scraper"
)


def scrape_reddit_data(
    num_posts: int,
    num_comments: int,
    keywords: list = None,
    subreddits: list = None,
    usernames: list = None,
    csv_file: str = None
):
    """
    Scrape Reddit posts and comments using PRAW.
    Supports optional filtering by keywords, subreddits, or usernames.
    
    Parameters:
        num_posts (int): Number of posts per subreddit/user.
        num_comments (int): Number of comments per post.
        keywords (list, optional): List of keywords to search for.
        subreddits (list, optional): List of subreddits to search in.
        usernames (list, optional): List of Reddit usernames to fetch posts from.
        csv_file (str, optional): If provided, save output CSV to this path.
    
    Returns:
        pd.DataFrame: Scraped posts and comments.
    """
    all_data = []

    keywords = keywords or [""]  # empty string matches all
    subreddits = subreddits or ["all"]

    # If usernames provided, fetch posts from those users
    if usernames:
        for username in usernames:
            print(f"\n🔍 Fetching posts and comments for user: {username}...\n")
            try:
                redditor = reddit.redditor(username)

                # Fetch posts
                submissions = redditor.submissions.new(limit=num_posts)
                for submission in submissions:
                    # same as before for posts and comments on post
                    pass

                # Fetch recent comments separately
                comments = redditor.comments.new(limit=num_comments)
                for comment in comments:
                    comment_post = comment.submission
                    all_data.append([
                        username,
                        comment_post.title,
                        comment_post.url,
                        str(comment_post.author),
                        comment_post.score,
                        comment_post.num_comments,
                        datetime.utcfromtimestamp(comment_post.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                        str(comment.author),
                        comment.body,
                        comment.score,
                        datetime.utcfromtimestamp(comment.created_utc).strftime('%Y-%m-%d %H:%M:%S')
                    ])
            except Exception as e:
                print(f"⚠️ Could not fetch for user {username}: {e}")

    # Otherwise, search by keywords + subreddits
    else:
        for keyword in keywords:
            for subreddit_name in subreddits:
                print(f"\n🔍 Searching in r/{subreddit_name} for: '{keyword}'...\n")
                subreddit = reddit.subreddit(subreddit_name)
                posts = subreddit.search(keyword, limit=num_posts, sort="new")

                for submission in posts:
                    post_title = submission.title
                    post_url = submission.url
                    post_author = str(submission.author) if submission.author else None
                    post_score = submission.score
                    post_comments_count = submission.num_comments
                    post_datetime = datetime.utcfromtimestamp(submission.created_utc).strftime('%Y-%m-%d %H:%M:%S')

                    # Fetch comments
                    submission.comments.replace_more(limit=0)
                    comments = submission.comments.list()[:num_comments]

                    if comments:
                        for comment in comments:
                            comment_author = str(comment.author) if comment.author else None
                            comment_body = comment.body
                            comment_score = comment.score
                            comment_datetime = datetime.utcfromtimestamp(comment.created_utc).strftime('%Y-%m-%d %H:%M:%S')

                            all_data.append([
                                keyword,
                                subreddit_name,
                                post_title,
                                post_url,
                                post_author,
                                post_score,
                                post_comments_count,
                                post_datetime,
                                comment_author,
                                comment_body,
                                comment_score,
                                comment_datetime
                            ])
                    else:
                        all_data.append([
                            keyword,
                            subreddit_name,
                            post_title,
                            post_url,
                            post_author,
                            post_score,
                            post_comments_count,
                            post_datetime,
                            None, None, None, None
                        ])

    # Columns
    if usernames:
        columns = [
            "Target_User", "Post_Title", "Post_URL", "Post_Author", "Post_Score",
            "Post_Comments_Count", "Post_DateTime", "Comment_Author", "Comment_Body",
            "Comment_Score", "Comment_DateTime"
        ]
    else:
        columns = [
            "Keyword/Tag", "Subreddit", "Post_Title", "Post_URL", "Post_Author", "Post_Score",
            "Post_Comments_Count", "Post_DateTime", "Comment_Author", "Comment_Body",
            "Comment_Score", "Comment_DateTime"
        ]

    df = pd.DataFrame(all_data, columns=columns)

    if csv_file:
        df.to_csv(csv_file, index=False, encoding="utf-8")
        print(f"\n✅ Data saved to {csv_file}")

    return df


def fetch_user_activity(username, num_posts=10, num_comments=10, reddit_instance=reddit):
    """
    Fetch last `num_posts` submissions and last `num_comments` comments by a Reddit user.
    """
    if reddit_instance is None:
        raise ValueError("Please provide a valid PRAW Reddit instance.")

    all_data = []

    try:
        redditor = reddit_instance.redditor(username)

        # Test if user exists (this will raise if deleted/suspended)
        _ = redditor.id  

        # Fetch submissions (posts)
        for submission in redditor.submissions.new(limit=num_posts):
            all_data.append([
                username,
                submission.title,
                submission.url,
                str(submission.author) if submission.author else "nil",
                submission.score,
                submission.num_comments,
                datetime.utcfromtimestamp(submission.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                "nil", "nil", "nil", "nil"
            ])

        # Fetch comments
        for comment in redditor.comments.new(limit=num_comments):
            submission = comment.submission
            all_data.append([
                username,
                submission.title,
                submission.url,
                str(submission.author) if submission.author else "nil",
                submission.score,
                submission.num_comments,
                datetime.utcfromtimestamp(submission.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                str(comment.author) if comment.author else "nil",
                comment.body,
                comment.score,
                datetime.utcfromtimestamp(comment.created_utc).strftime('%Y-%m-%d %H:%M:%S')
            ])

    except Exception as e:
        print(f"⚠️ Could not fetch data for user '{username}': {e}")

    columns = [
        "Target_User", "Post_Title", "Post_URL", "Post_Author", "Post_Score",
        "Post_Comments_Count", "Post_DateTime", "Comment_Author", "Comment_Body",
        "Comment_Score", "Comment_DateTime"
    ]

    df = pd.DataFrame(all_data, columns=columns)
    return df



