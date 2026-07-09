def get_anti_india_comment_users(df, label_col='OpenAI_Label_Comment', author_col='Comment_Author'):
    """
    Extract usernames where the specified label column is 1.
    
    Parameters:
        df (pd.DataFrame): The dataframe containing the data
        label_col (str): Column name for the label (default: 'OpenAI_Label_Comment')
        author_col (str): Column name for the author (default: 'Comment_Author')
    
    Returns:
        list: List of unique usernames
    """
    anti_india_users = df[df[label_col] == 1][author_col].dropna().unique()
    return anti_india_users.tolist()

