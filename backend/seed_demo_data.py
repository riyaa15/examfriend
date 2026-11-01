import datetime
import json
from database import SessionLocal, engine, Base
import models
import auth
import pdf_utils

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if demo student exists
        demo_user = db.query(models.User).filter(models.User.email == "student@examfriend.edu").first()
        if not demo_user:
            demo_user = models.User(
                username="Riya (Topper)",
                email="student@examfriend.edu",
                hashed_password=auth.hash_password("password123")
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print(f"Created demo student: {demo_user.email}")
        else:
            print("Demo student already exists.")

        # Seed Exams if none exist
        if db.query(models.Exam).filter(models.Exam.user_id == demo_user.id).count() == 0:
            today = datetime.date.today()
            exams = [
                models.Exam(
                    user_id=demo_user.id,
                    name="Machine Learning & Deep Learning Endterm",
                    exam_date=today + datetime.timedelta(days=4),
                    exam_time="09:30",
                    exam_type="Semester Final",
                    notes="Must score 95%+, review backprop and transformers"
                ),
                models.Exam(
                    user_id=demo_user.id,
                    name="Cloud Computing & DevOps Final",
                    exam_date=today + datetime.timedelta(days=10),
                    exam_time="14:00",
                    exam_type="Semester Final",
                    notes="Focus on Kubernetes and AWS architecture"
                ),
                models.Exam(
                    user_id=demo_user.id,
                    name="Computer Networks Viva & Oral Examination",
                    exam_date=today + datetime.timedelta(days=16),
                    exam_time="11:00",
                    exam_type="Lab / Practical Exam",
                    notes="TCP/IP handshakes, routing protocols and socket programming"
                )
            ]
            db.add_all(exams)
            db.commit()
            print("Seeded exams in chronological order.")

        # Seed Subjects & Syllabus Tracker if none exist
        if db.query(models.Subject).filter(models.Subject.user_id == demo_user.id).count() == 0:
            sub1 = models.Subject(
                user_id=demo_user.id,
                name="Machine Learning",
                num_modules=3,
                syllabus_filename="ML_CS801_Syllabus.pdf"
            )
            db.add(sub1)
            db.commit()
            db.refresh(sub1)

            # Module 1
            m1 = models.Module(subject_id=sub1.id, module_number=1, module_title="Supervised Learning Fundamentals")
            db.add(m1)
            db.commit()
            db.refresh(m1)
            db.add_all([
                models.Topic(module_id=m1.id, topic_title="Linear Regression & Cost Function Optimization", is_completed=True),
                models.Topic(module_id=m1.id, topic_title="Logistic Regression & Binary Cross-Entropy", is_completed=True),
                models.Topic(module_id=m1.id, topic_title="Decision Trees & Information Gain (ID3 / C4.5)", is_completed=True),
                models.Topic(module_id=m1.id, topic_title="Support Vector Machines (SVM) & Kernel Trick", is_completed=False)
            ])

            # Module 2
            m2 = models.Module(subject_id=sub1.id, module_number=2, module_title="Unsupervised Learning & Clustering")
            db.add(m2)
            db.commit()
            db.refresh(m2)
            db.add_all([
                models.Topic(module_id=m2.id, topic_title="K-Means Clustering & Elbow Method Evaluation", is_completed=True),
                models.Topic(module_id=m2.id, topic_title="Principal Component Analysis (PCA) & Eigenvectors", is_completed=False),
                models.Topic(module_id=m2.id, topic_title="Hierarchical Agglomerative Clustering & Dendrograms", is_completed=False)
            ])

            # Module 3
            m3 = models.Module(subject_id=sub1.id, module_number=3, module_title="Neural Networks & Deep Architectures")
            db.add(m3)
            db.commit()
            db.refresh(m3)
            db.add_all([
                models.Topic(module_id=m3.id, topic_title="Multi-Layer Perceptron (MLP) & Backpropagation", is_completed=True),
                models.Topic(module_id=m3.id, topic_title="Convolutional Neural Networks (CNN) for Computer Vision", is_completed=False),
                models.Topic(module_id=m3.id, topic_title="Overfitting Regularization (Dropout, L1/L2 Weight Decay)", is_completed=False)
            ])
            db.commit()

            # Second subject
            sub2 = models.Subject(
                user_id=demo_user.id,
                name="Cloud Computing",
                num_modules=2,
                syllabus_filename="Cloud_DevOps_Syllabus.pdf"
            )
            db.add(sub2)
            db.commit()
            db.refresh(sub2)

            m2_1 = models.Module(subject_id=sub2.id, module_number=1, module_title="Cloud Virtualization & Storage")
            db.add(m2_1)
            db.commit()
            db.refresh(m2_1)
            db.add_all([
                models.Topic(module_id=m2_1.id, topic_title="Hypervisors (Type 1 vs Type 2) & Containerization", is_completed=True),
                models.Topic(module_id=m2_1.id, topic_title="Cloud Storage Architecture (Block, Object & File)", is_completed=True)
            ])

            m2_2 = models.Module(subject_id=sub2.id, module_number=2, module_title="Kubernetes & Microservices Orchestration")
            db.add(m2_2)
            db.commit()
            db.refresh(m2_2)
            db.add_all([
                models.Topic(module_id=m2_2.id, topic_title="Kubernetes Pods, ReplicaSets, and Deployments", is_completed=False),
                models.Topic(module_id=m2_2.id, topic_title="CI/CD Pipeline Automation & Infrastructure as Code", is_completed=False)
            ])
            db.commit()
            print("Seeded subjects, modules, and topic hierarchy with Done ticks.")

        print("Demo seed completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
