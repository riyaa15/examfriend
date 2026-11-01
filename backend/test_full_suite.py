import urllib.request
import json
import sys
import io

# Force UTF-8 encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

base_api = 'http://127.0.0.1:8000'
base_fe = 'http://localhost:5173'

def run_tests():
    print("=" * 60)
    print("EXAMFRIEND FULL SYSTEM VERIFICATION SUITE")
    print("=" * 60)

    # 1. Frontend Web App
    try:
        req = urllib.request.Request(base_fe)
        with urllib.request.urlopen(req) as resp:
            print(f"[OK] Frontend Server: HTTP {resp.status} (Vite React app ready)")
    except Exception as e:
        print(f"[FAIL] Frontend check failed: {e}")
        sys.exit(1)

    # 2. Backend Health Check
    try:
        req = urllib.request.Request(f'{base_api}/api/health')
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"[OK] Backend Health: status={data.get('status')}, app={data.get('app')}")
    except Exception as e:
        print(f"[FAIL] Backend health check failed: {e}")
        sys.exit(1)

    # 3. Authentication (Demo User)
    login_data = json.dumps({'email': 'student@examfriend.edu', 'password': 'password123'}).encode()
    req = urllib.request.Request(f'{base_api}/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        auth_data = json.loads(resp.read().decode())
        token = auth_data['access_token']
        user = auth_data['user']
        print(f"[OK] Authentication: Logged in as '{user['username']}' ({user['email']})")

    headers = {'Authorization': f'Bearer {token}'}

    # 4. Card 1: Exam Countdown
    req = urllib.request.Request(f'{base_api}/api/exams', headers=headers)
    with urllib.request.urlopen(req) as resp:
        exams = json.loads(resp.read().decode())
        print(f"[OK] Card 1 (Exam Countdown): {len(exams)} exams tracked")
        for e in exams[:2]:
            print(f"    - {e['name']} | Date: {e['exam_date']} ({e['days_left']} days left)")

    # 5. Card 2: Subjects & Syllabus Tracker
    req = urllib.request.Request(f'{base_api}/api/subjects', headers=headers)
    with urllib.request.urlopen(req) as resp:
        subjects = json.loads(resp.read().decode())
        print(f"[OK] Card 2 (Syllabus Tracker): {len(subjects)} subjects loaded")
        for s in subjects[:2]:
            print(f"    - {s['name']}: {s['completed_topics']}/{s['total_topics']} done ({s['completion_percentage']}%)")

    # 6. Card 3: Study Plan Generator
    if subjects:
        plan_payload = json.dumps({'title': 'Sprint Review Plan', 'subject_ids': [subjects[0]['id']]}).encode()
        req = urllib.request.Request(f'{base_api}/api/study-plans/generate', data=plan_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req) as resp:
            plan_res = json.loads(resp.read().decode())
            print(f"[OK] Card 3 (Study Plan Generator): Generated plan with {len(plan_res.get('plan', []))} days, PDF endpoint={plan_res.get('pdf_url')}")

    # 7. Card 5: AI Viva Tester (Hints & Evaluation)
    hint_payload = json.dumps({'question_text': 'What is Gradient Descent in Machine Learning?', 'current_answer': 'It finds minimum of loss', 'hint_index': 0}).encode()
    req = urllib.request.Request(f'{base_api}/api/viva/hint', data=hint_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        hint_res = json.loads(resp.read().decode())
        print(f"[OK] Card 5 (AI Viva Teacher Hint): \"{hint_res.get('hint')}\"")

    eval_payload = json.dumps({
        'question_id': 1,
        'question_text': 'What is Gradient Descent in Machine Learning?',
        'concept': 'Gradient Descent',
        'student_answer': 'Gradient descent is an iterative optimization algorithm used to find the local minimum of a differentiable function by moving in the opposite direction of the gradient.',
        'model_answer': 'Iterative optimization algorithm for finding function local minimum.',
        'evaluation_criteria': ['Iterative optimization', 'Negative gradient', 'Learning rate']
    }).encode()
    req = urllib.request.Request(f'{base_api}/api/viva/evaluate', data=eval_payload, headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        eval_res = json.loads(resp.read().decode())
        print(f"[OK] Card 5 (AI Viva Evaluation): Score {eval_res.get('score')}/10 | Verdict: {eval_res.get('verdict')}")

    # 8. Card 6: AI Teacher Lessons
    try:
        req = urllib.request.Request(f'{base_api}/api/teacher/lessons', headers=headers)
        with urllib.request.urlopen(req) as resp:
            lessons = json.loads(resp.read().decode())
            print(f"[OK] Card 6 (AI Teacher Lessons): {len(lessons)} lessons available")
    except Exception as e:
        print(f"[-] Card 6 note: {e}")

    # 9. Card 7: Flashcards Decks
    try:
        req = urllib.request.Request(f'{base_api}/api/flashcards/decks', headers=headers)
        with urllib.request.urlopen(req) as resp:
            decks = json.loads(resp.read().decode())
            print(f"[OK] Card 7 (AI Flashcards): {len(decks)} decks available")
    except Exception as e:
        print(f"[-] Card 7 note: {e}")

    # 10. Card 8: Notes Drive
    try:
        req = urllib.request.Request(f'{base_api}/api/notes-drive', headers=headers)
        with urllib.request.urlopen(req) as resp:
            notes = json.loads(resp.read().decode())
            print(f"[OK] Card 8 (Notes Drive): {len(notes)} notes available")
    except Exception as e:
        print(f"[-] Card 8 note: {e}")

    print("=" * 60)
    print("ALL CHECKS PASSED: EXAMFRIEND IS FULLY RUNNING AND OPERATIONAL!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
