import os, urllib.request, json, sys

api_url = os.environ['PAPERCLIP_API_URL']
api_key = os.environ['PAPERCLIP_API_KEY']
run_id = os.environ.get('PAPERCLIP_RUN_ID', '')

def get(path):
    req = urllib.request.Request(
        f'{api_url}{path}',
        headers={'Authorization': f'Bearer {api_key}'}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def post(path, body, method='POST'):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f'{api_url}{path}',
        data=data,
        method=method,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'X-Paperclip-Run-Id': run_id
        }
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

def patch(path, body):
    return post(path, body, method='PATCH')

action = sys.argv[1] if len(sys.argv) > 1 else 'comment'
issue_id = sys.argv[2] if len(sys.argv) > 2 else ''
arg3 = sys.argv[3] if len(sys.argv) > 3 else ''

if action == 'get-comment':
    result = get(f'/api/issues/{issue_id}/comments/{arg3}')
    print(json.dumps(result, indent=2))

elif action == 'heartbeat-context':
    result = get(f'/api/issues/{issue_id}/heartbeat-context')
    print(json.dumps(result, indent=2))

elif action == 'checkout':
    result = post(f'/api/issues/{issue_id}/checkout', {
        'agentId': '809b1be9-e794-4ab5-9ae2-0ad4c967ea10',
        'expectedStatuses': ['todo', 'backlog', 'blocked', 'in_progress']
    })
    print(json.dumps(result, indent=2))

elif action == 'get-issue':
    result = get(f'/api/issues/{issue_id}')
    print(json.dumps(result, indent=2))

elif action == 'comments':
    result = get(f'/api/issues/{issue_id}/comments')
    print(json.dumps(result, indent=2))

elif action == 'patch':
    body = json.loads(arg3)
    result = patch(f'/api/issues/{issue_id}', body)
    print(json.dumps(result, indent=2))

elif action == 'post-comment':
    result = post(f'/api/issues/{issue_id}/comments', {'body': arg3})
    print(json.dumps(result, indent=2))

elif action == 'get':
    result = get(f'/api/issues/{issue_id}')
    print(json.dumps(result, indent=2))
