import urllib.request
import json

base_api = 'http://127.0.0.1:8000'
base_fe = 'http://localhost:5173'

# 1. Test Frontend
req = urllib.request.Request(base_fe)
with urllib.request.urlopen(req) as resp:
    print('Frontend Status:', resp.status)

# 2. Test Backend Health
req = urllib.request.Request(f'{base_api}/api/health')
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print('Backend Health:', data)

# 3. Test Login
login_data = json.dumps({'email': 'student@examfriend.edu', 'password': 'password123'}).encode()
req = urllib.request.Request(f'{base_api}/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    auth_data = json.loads(resp.read().decode())
    token = auth_data['access_token']
    print('Auth Login Success! User:', auth_data['user']['username'])

headers = {'Authorization': f'Bearer {token}'}

# 4. Test Card 1: Exams (Chronologically sorted)
req = urllib.request.Request(f'{base_api}/api/exams', headers=headers)
with urllib.request.urlopen(req) as resp:
    exams = json.loads(resp.read().decode())
    print(f'Card 1 Exams Count: {len(exams)}')
    for e in exams:
        print(f"  - {e['name']} | Date: {e['exam_date']} | Days left: {e['days_left']}")

# 5. Test Card 2: Subjects & Syllabus
req = urllib.request.Request(f'{base_api}/api/subjects', headers=headers)
with urllib.request.urlopen(req) as resp:
    subjects = json.loads(resp.read().decode())
    print(f'Card 2 Subjects Count: {len(subjects)}')
    for s in subjects:
        print(f"  - {s['name']}: {s['completed_topics']}/{s['total_topics']} topics ({s['completion_percentage']}%)")

# 6. Test Card 3: Study Plan Generation
plan_payload = json.dumps({'title': 'Endterm Sprint Plan', 'subject_ids': [subjects[0]['id']]}).encode()
req = urllib.request.Request(f'{base_api}/api/study-plans/generate', data=plan_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as resp:
    plan_res = json.loads(resp.read().decode())
    print('Card 3 Study Plan Generated! PDF:', plan_res['pdf_url'], 'Days:', len(plan_res['plan']))

# 7. Test Card 5: Teacher Hint
hint_payload = json.dumps({'question_text': 'Explain Backpropagation in Neural Networks', 'current_answer': 'It uses calculus...', 'hint_index': 0}).encode()
req = urllib.request.Request(f'{base_api}/api/viva/hint', data=hint_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as resp:
    hint_res = json.loads(resp.read().decode())
    print('Card 5 Teacher Hint:', hint_res['hint'])

# 8. Test Card 5: Viva Evaluation
eval_payload = json.dumps({
    'question_id': 1,
    'question_text': 'Explain Backpropagation in Neural Networks',
    'concept': 'Backpropagation',
    'student_answer': 'Backpropagation computes the gradient of the loss function with respect to each weight using the chain rule to update weights via gradient descent.',
    'model_answer': 'Chain rule propagation of errors backwards through network layers.',
    'evaluation_criteria': ['Chain rule', 'Loss function', 'Gradient descent']
}).encode()
req = urllib.request.Request(f'{base_api}/api/viva/evaluate', data=eval_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as resp:
    eval_res = json.loads(resp.read().decode())
    print(f"Card 5 Viva Evaluation Score: {eval_res['score']} / 10 | Verdict: {eval_res['verdict']}")

print("\nALL FULL-STACK TESTS PASSED WITH 100% SUCCESS!")
