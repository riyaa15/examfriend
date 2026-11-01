import sys
import os
sys.path.append(r"c:\Users\Riya\Downloads\exam\backend")

from pdf_utils import generate_handwritten_notes_pdf
from ai_service import generate_handwritten_notes_with_qa

def test_pdf():
    print("Testing generate_handwritten_notes_pdf with NLP notes...")
    notes = generate_handwritten_notes_with_qa(
        topic="Explain the Levels/Tasks of NLP.",
        subject_name="Natural Language Processing (SEM7)",
        content_text=""
    )
    
    output_path = r"c:\Users\Riya\Downloads\exam\backend\test_nlp_notes.pdf"
    res = generate_handwritten_notes_pdf(notes, output_path)
    print(f"Generated PDF successfully: {res}, size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    test_pdf()
