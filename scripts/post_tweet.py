#!/usr/bin/env python3
"""Post to X (Twitter) using GoodClaw account."""
import tweepy
import sys
import os

# API credentials
CONSUMER_KEY = "JZZVUHgsDYeUDP6wEttTYXMoh"
CONSUMER_SECRET = "XB8YyqaAU0FKfZSeVo0vKN56X0Up7DGNi6fAMNHotqzLTrz1tF"
ACCESS_TOKEN = "2040014258587492352-8ByJCIZB9cWFlJQVPt40RgNcY8H5NF"
ACCESS_TOKEN_SECRET = "ws1U4HlpiK8Gr7fZ6XjXDKQix4SY22iZkRGA0D4dmisc0"

def post_tweet(text, reply_to=None):
    """Post a tweet. Returns tweet ID."""
    client = tweepy.Client(
        consumer_key=CONSUMER_KEY,
        consumer_secret=CONSUMER_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )
    kwargs = {"text": text}
    if reply_to:
        kwargs["in_reply_to_tweet_id"] = reply_to
    response = client.create_tweet(**kwargs)
    tweet_id = response.data["id"]
    print(f"Posted: {tweet_id}")
    print(f"URL: https://x.com/GClaw39851/status/{tweet_id}")
    return tweet_id

def post_thread(tweets):
    """Post a thread of tweets. Returns list of tweet IDs."""
    ids = []
    reply_to = None
    for i, text in enumerate(tweets):
        print(f"\nTweet {i+1}/{len(tweets)}:")
        print(f"  {text[:80]}...")
        tweet_id = post_tweet(text, reply_to=reply_to)
        ids.append(tweet_id)
        reply_to = tweet_id
    return ids

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
        post_tweet(text)
    else:
        print("Usage: python3 post_tweet.py <text>")
        print("       Or import and use post_thread([tweet1, tweet2, ...])")
