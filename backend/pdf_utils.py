import os
import datetime
import zipfile
from typing import List, Dict, Any
import fitz # PyMuPDF
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether, PageBreak
)

import re

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts all text from a given PDF using PyMuPDF.
    If the PDF is a scanned document (or has negligible digital text),
    it automatically activates RapidOCR to extract the actual written/printed material."""
    text_content = []
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            t = page.get_text()
            if t:
                text_content.append(t)
        doc.close()
    except Exception as e:
        print(f"PyMuPDF extract failed ({e}), falling back to pypdf...")
        try:
            reader = PdfReader(pdf_path)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text_content.append(t)
        except Exception as e2:
            print(f"pypdf extract also failed: {e2}")

    raw_text = "\n".join(text_content).strip()
    # Filter scanner watermarks like 'Scanned with ACE Scanner', 'CamScanner', etc.
    cleaned_text = re.sub(r'(?i)scanned with [^\n]+', '', raw_text).strip()
    cleaned_text = re.sub(r'(?i)scanned by [^\n]+', '', cleaned_text).strip()

    # If digital text is negligible (< 100 chars), this is a SCANNED PDF!
    # Run RapidOCR to read the actual notes material from page images.
    if len(cleaned_text) < 100:
        print(f"[OCR] Low digital text layer ({len(cleaned_text)} chars). Activating RapidOCR for: {pdf_path}")
        try:
            from rapidocr_onnxruntime import RapidOCR
            ocr_engine = RapidOCR()
            doc = fitz.open(pdf_path)
            ocr_pages = []

            for page_idx, page in enumerate(doc):
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                result, _ = ocr_engine(img_bytes)
                if result:
                    lines = []
                    for line in result:
                        txt = line[1].strip() if len(line) > 1 else ""
                        if txt and not re.search(r'(?i)scanned with|camscanner|ace scanner|adobe scan', txt):
                            lines.append(txt)
                    if lines:
                        ocr_pages.append(f"--- Page {page_idx + 1} ---\n" + "\n".join(lines))
            doc.close()

            if ocr_pages:
                ocr_full = "\n\n".join(ocr_pages)
                print(f"[OCR] Successfully extracted {len(ocr_full)} characters from scanned pages.")
                return ocr_full
        except Exception as ocr_err:
            print(f"[OCR] RapidOCR error: {ocr_err}")

    return cleaned_text if cleaned_text else raw_text

def extract_papers_from_zip(zip_path: str, extract_dir: str) -> str:
    """Extracts all text from past question papers contained inside an uploaded ZIP."""
    combined_texts = []
    os.makedirs(extract_dir, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)

    for root, dirs, files in os.walk(extract_dir):
        for file in files:
            file_path = os.path.join(root, file)
            lower_name = file.lower()
            if lower_name.endswith(".pdf"):
                txt = extract_text_from_pdf(file_path)
                if txt:
                    combined_texts.append(f"--- PAST PAPER: {file} ---\n{txt}")
            elif lower_name.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")):
                try:
                    from rapidocr_onnxruntime import RapidOCR
                    ocr_engine = RapidOCR()
                    result, _ = ocr_engine(file_path)
                    if result:
                        lines = [line[1].strip() for line in result if len(line) > 1 and line[1].strip()]
                        if lines:
                            combined_texts.append(f"--- PAST PAPER (IMAGE): {file} ---\n" + "\n".join(lines))
                except Exception as e:
                    print(f"Error OCR-ing paper image {file}: {e}")
            elif lower_name.endswith((".txt", ".md", ".csv")):
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        combined_texts.append(f"--- PAST PAPER: {file} ---\n{f.read()}")
                except Exception as e:
                    print(f"Error reading text paper {file}: {e}")
            elif lower_name.endswith(".docx"):
                try:
                    import xml.etree.ElementTree as ET
                    with zipfile.ZipFile(file_path) as z:
                        xml_content = z.read('word/document.xml')
                        tree = ET.fromstring(xml_content)
                        t_parts = []
                        for elem in tree.iter():
                            if elem.tag.endswith('}t'):
                                t_parts.append(elem.text or '')
                            elif elem.tag.endswith('}p'):
                                t_parts.append('\n')
                        combined_texts.append(f"--- PAST PAPER: {file} ---\n{''.join(t_parts)}")
                except Exception as e:
                    print(f"Error extracting docx {file}: {e}")

    return "\n\n".join(combined_texts)

# ----------------- PDF GENERATORS ----------------- #

def generate_study_plan_pdf(
    plan_title: str,
    user_name: str,
    days_data: List[Dict[str, Any]],
    output_path: str
) -> str:
    """Generates a beautifully styled, printable PDF study planner."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    primary_color = colors.HexColor("#4F46E5") # Indigo
    secondary_color = colors.HexColor("#06B6D4") # Cyan
    text_dark = colors.HexColor("#1E293B")
    bg_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=1 # Center
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#64748B"),
        alignment=1
    )

    header_cell_style = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.white
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=text_dark
    )

    bold_cell_style = ParagraphStyle(
        'BoldCellText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=primary_color
    )

    elements = []

    # Title & Branding Header
    elements.append(Paragraph("EXAMFRIEND &bull; Structured Daily Study Plan", title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"Personalized Schedule for <b>{user_name}</b> | Plan: <b>{plan_title}</b>", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=14))

    # Study Plan Table Data
    table_data = [
        [
            Paragraph("Day", header_cell_style),
            Paragraph("Target Date", header_cell_style),
            Paragraph("Subject", header_cell_style),
            Paragraph("Topic 1 (Core Focus)", header_cell_style),
            Paragraph("Topic 2 (Practice & Depth)", header_cell_style),
            Paragraph("Status", header_cell_style)
        ]
    ]

    holiday_row_indices = []

    for r_idx, item in enumerate(days_data, start=1):
        day_str = str(item.get("day", "Day"))
        date_str = str(item.get("date", "-"))
        subj_str = str(item.get("subject", "-"))
        is_holiday = item.get("is_holiday", False)
        
        if is_holiday:
            holiday_row_indices.append(r_idx)
            table_data.append([
                Paragraph(f"<b>{day_str}</b>", bold_cell_style),
                Paragraph(date_str, cell_style),
                Paragraph("<b>🌴 Holiday</b>", ParagraphStyle('HolSubj', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor("#059669"))),
                Paragraph("<b>Rest Day &bull; No study scheduled</b>", ParagraphStyle('HolTopic1', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8.5, textColor=colors.HexColor("#047857"))),
                Paragraph("Rest, recharge & light review", ParagraphStyle('HolTopic2', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8.5, textColor=colors.HexColor("#047857"))),
                Paragraph("<b>Rest Day</b>", ParagraphStyle('HolStat', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor("#059669")))
            ])
            continue

        # Extract all topics cleanly for this day (supporting multi-topic day-wise schedules)
        raw_topics = item.get("topics") or []
        if not raw_topics:
            raw_t = str(item.get("topic", "-"))
            if " • " in raw_t:
                raw_topics = [t.strip() for t in raw_t.split(" • ") if t.strip()]
            elif "\n" in raw_t:
                raw_topics = [t.strip() for t in raw_t.split("\n") if t.strip()]
            else:
                raw_topics = [raw_t]

        t1 = raw_topics[0] if len(raw_topics) > 0 else str(item.get("topic_1", item.get("topic", "-")))
        clean_t1 = str(t1).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        if len(raw_topics) == 2:
            t2 = raw_topics[1]
            clean_t2 = f"<b>2.</b> " + str(t2).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        elif len(raw_topics) > 2:
            clean_t2 = "<br/>".join([f"<b>{i+2}.</b> " + str(top).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") for i, top in enumerate(raw_topics[1:])])
        else:
            t2 = item.get("topic_2", "Formula Practice & Active Recall")
            clean_t2 = str(t2).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        status_str = "[   ] Done" if not item.get("completed", False) else "[ X ] Completed"

        if len(subj_str) > 40:
            subj_str = subj_str[:37] + "..."

        prio_str = str(item.get("priority", ""))
        prio_tag = f"<br/><font size=7 color='#4f46e5'><b>[{prio_str} Priority]</b></font>" if prio_str and prio_str != "Rest" else ""

        table_data.append([
            Paragraph(f"<b>{day_str}</b>", bold_cell_style),
            Paragraph(date_str, cell_style),
            Paragraph(f"<b>{subj_str}</b>{prio_tag}", bold_cell_style),
            Paragraph(f"<b>1.</b> {clean_t1}", cell_style),
            Paragraph(clean_t2, cell_style),
            Paragraph(status_str, cell_style)
        ])

    col_widths = [45, 65, 105, 140, 140, 45]
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    table_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_light])
    ]
    for h_idx in holiday_row_indices:
        table_styles.append(('BACKGROUND', (0, h_idx), (-1, h_idx), colors.HexColor("#ECFDF5")))
    t.setStyle(TableStyle(table_styles))

    elements.append(t)
    elements.append(Spacer(1, 18))
    
    # Study Tips & Notes Box
    notes_style = ParagraphStyle(
        'NotesText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#475569")
    )
    elements.append(Paragraph("<b>Pro Tip for Exam Success:</b> Stick to 45-minute focused Pomodoro study blocks followed by 10-minute active recall breaks. Tick the boxes as you finish each topic to maintain momentum!", notes_style))

    doc.build(elements)
    return output_path

def generate_practice_paper_pdf(
    paper_dict: Dict[str, Any],
    output_path: str
) -> str:
    """Generates a formal, printable University-standard Mock Examination Paper."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'PaperHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        alignment=1
    )

    subhead_style = ParagraphStyle(
        'PaperSubhead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        alignment=1
    )

    info_style = ParagraphStyle(
        'PaperInfo',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13
    )

    sec_title_style = ParagraphStyle(
        'SecTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=10,
        spaceAfter=4
    )

    question_style = ParagraphStyle(
        'QuestionText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0F172A")
    )

    marks_style = ParagraphStyle(
        'MarksText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        alignment=2 # Right align
    )

    hint_style = ParagraphStyle(
        'HintText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#2563EB")
    )

    elements = []

    # Paper Top Header
    title = paper_dict.get("title", "MOCK EXAMINATION PAPER")
    total_marks = paper_dict.get("total_marks", 100)
    duration = paper_dict.get("duration_mins", 180)

    elements.append(Paragraph("EXAMFRIEND &bull; PRACTICE QUESTION PAPER", header_style))
    elements.append(Spacer(1, 3))
    elements.append(Paragraph(title.upper(), subhead_style))
    elements.append(Spacer(1, 8))

    # Meta Info Table
    meta_data = [
        [
            Paragraph(f"<b>Time Allowed:</b> {duration // 60} Hours {duration % 60} Mins", info_style),
            Paragraph(f"<b>Maximum Marks:</b> {total_marks}", ParagraphStyle('RightMeta', parent=info_style, alignment=2))
        ]
    ]
    meta_table = Table(meta_data, colWidths=[260, 255])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2)
    ]))
    elements.append(meta_table)
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=4, spaceAfter=8))

    # Instructions
    instructions = paper_dict.get("instructions", [
        "Read all questions carefully.",
        "Illustrate your answers with neat sketches wherever necessary."
    ])
    elements.append(Paragraph("<b>General Instructions:</b>", info_style))
    for idx, inst in enumerate(instructions, 1):
        elements.append(Paragraph(f"{idx}. {inst}", ParagraphStyle('InstText', parent=info_style, leftIndent=12)))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.gray, spaceBefore=2, spaceAfter=10))

    # Sections
    sections = paper_dict.get("sections", [])
    for sec in sections:
        sec_name = sec.get("section_name", "SECTION")
        sec_desc = sec.get("description", "")
        elements.append(Paragraph(f"<b>{sec_name}</b> {f'— {sec_desc}' if sec_desc else ''}", sec_title_style))
        elements.append(Spacer(1, 4))

        questions = sec.get("questions", [])
        q_table_data = []
        for q in questions:
            q_no = q.get("q_no", "1")
            q_text = q.get("question", "")
            q_marks = q.get("marks", 2)
            q_hint = q.get("answer_hint", "")

            # Question block
            q_content = [Paragraph(f"<b>Q.{q_no}</b> {q_text}", question_style)]
            if q_hint:
                q_content.append(Spacer(1, 2))
                q_content.append(Paragraph(f"<i>Key Solution Points: {q_hint}</i>", hint_style))
            q_content.append(Spacer(1, 6))

            q_table_data.append([
                q_content,
                Paragraph(f"[{q_marks} M]", marks_style)
            ])

        q_table = Table(q_table_data, colWidths=[450, 65])
        q_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4)
        ]))
        elements.append(q_table)
        elements.append(Spacer(1, 8))

    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=10, spaceAfter=8))
    elements.append(Paragraph("<b>*** END OF QUESTION PAPER &bull; ALL THE BEST ***</b>", ParagraphStyle('EndPaper', parent=header_style, fontSize=10)))

    doc.build(elements)
    return output_path

def generate_question_bank_pdf(
    bank_data: Dict[str, Any],
    output_path: str
) -> str:
    """Generates an authoritative, beautifully organized Question Bank PDF with deduplicated questions, frequency indicators, and model solutions."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#4f46e5") # Indigo
    secondary_color = colors.HexColor("#06b6d4") # Cyan
    text_dark = colors.HexColor("#0f172a")
    text_muted = colors.HexColor("#64748b")
    bg_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#e2e8f0")
    badge_green = colors.HexColor("#10b981")
    badge_amber = colors.HexColor("#f59e0b")

    title_style = ParagraphStyle(
        'QBTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color,
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'QBSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=text_dark,
        alignment=1
    )

    meta_style = ParagraphStyle(
        'QBMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_muted,
        alignment=1
    )

    section_heading = ParagraphStyle(
        'QBSection',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.white
    )

    q_title_style = ParagraphStyle(
        'QBQTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=text_dark
    )

    freq_style = ParagraphStyle(
        'QBFreq',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=badge_amber
    )

    solution_style = ParagraphStyle(
        'QBSolution',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    marks_style = ParagraphStyle(
        'QBMarks',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        alignment=2,
        textColor=primary_color
    )

    elements = []

    # Title & Header
    title = bank_data.get("title", "Comprehensive Question Bank")
    subject = bank_data.get("subject_name", "Academic Examination")
    papers_count = bank_data.get("total_papers_analyzed", 1)
    total_q = bank_data.get("total_questions", 0)
    questions = bank_data.get("questions", [])

    elements.append(Paragraph(f"<b>EXAMFRIEND &bull; ACADEMIC QUESTION BANK</b>", title_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>{subject} — {title}</b>", subtitle_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f"Analyzed <b>{papers_count} Past Paper(s)</b> | Extracted <b>{total_q} Unique Questions</b> (All duplicates filtered & merged) | Date: {datetime.date.today().strftime('%B %d, %Y')}",
        meta_style
    ))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=12))

    # Group questions by module or category
    modules_dict = {}
    for q in questions:
        mod = q.get("module_name") or f"Module {q.get('module_number', 1)}"
        if mod not in modules_dict:
            modules_dict[mod] = []
        modules_dict[mod].append(q)

    # Render each module
    for mod_name, q_list in modules_dict.items():
        # Module Banner Table
        sec_table = Table([[Paragraph(f"<b>{mod_name.upper()} &bull; ({len(q_list)} Questions)</b>", section_heading)]], colWidths=[520])
        sec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), primary_color),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(sec_table)
        elements.append(Spacer(1, 8))

        q_table_data = []
        for idx, q in enumerate(q_list, 1):
            q_text = q.get("question", "")
            q_marks = q.get("marks", 5)
            freq = q.get("frequency", 1)
            years = q.get("years_asked", [])
            years_str = f" [Years: {', '.join(map(str, years))}]" if years else ""
            prob = q.get("exam_probability", "High")
            solution = q.get("model_answer", "") or q.get("solution_steps", "")

            q_flowables = [
                Paragraph(f"<b>Q{idx}. {q_text}</b>", q_title_style),
                Spacer(1, 2)
            ]

            if freq > 1 or years:
                q_flowables.append(Paragraph(f"⭐ <b>REPEATED {freq} TIMES</b> in past papers{years_str} &bull; Likelihood: <b>{prob}</b>", freq_style))
                q_flowables.append(Spacer(1, 2))

            if solution:
                q_flowables.append(Paragraph(f"<b>Model Solution / Key Points:</b> {solution}", solution_style))
                q_flowables.append(Spacer(1, 4))

            q_table_data.append([
                q_flowables,
                Paragraph(f"[{q_marks} Marks]", marks_style)
            ])

        q_table = Table(q_table_data, colWidths=[445, 75])
        q_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, border_color),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, bg_light])
        ]))
        elements.append(q_table)
        elements.append(Spacer(1, 14))

    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#94a3b8"), spaceBefore=10, spaceAfter=8))
    elements.append(Paragraph("<b>EXAMFRIEND &bull; Master Every Question with Confidence</b>", ParagraphStyle('QBEnd', parent=subtitle_style, fontSize=9, textColor=text_muted)))

    doc.build(elements)
    return output_path

def extract_text_from_file_or_photo(file_path: str) -> str:
    """Extracts text from a PDF, or an uploaded photo/image (JPG, PNG, WEBP), or text file."""
    if not os.path.exists(file_path):
        return ""
    
    lower_path = file_path.lower()
    if lower_path.endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    
    if lower_path.endswith(".zip"):
        extract_dir = os.path.join(os.path.dirname(file_path), f"unzipped_{os.path.splitext(os.path.basename(file_path))[0]}")
        return extract_papers_from_zip(file_path, extract_dir)
    
    # Handle Image / Photo files with RapidOCR
    if lower_path.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff")):
        try:
            from rapidocr_onnxruntime import RapidOCR
            ocr_engine = RapidOCR()
            result, _ = ocr_engine(file_path)
            if result:
                lines = []
                for line in result:
                    txt = line[1].strip() if len(line) > 1 else ""
                    if txt and not re.search(r'(?i)scanned with|camscanner|ace scanner|adobe scan', txt):
                        lines.append(txt)
                if lines:
                    extracted = "\n".join(lines).strip()
                    print(f"[OCR] Extracted {len(extracted)} chars from photo: {os.path.basename(file_path)}")
                    return extracted
        except Exception as e:
            print(f"[OCR] Error extracting text from image {file_path}: {e}")
            return ""

    if lower_path.endswith((".txt", ".md", ".csv")):
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception as e:
            print(f"Error reading text file: {e}")
            return ""

    if lower_path.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs if p.text]).strip()
        except Exception:
            return ""

    return ""

def generate_handwritten_notes_pdf(notes_data: Dict[str, Any], output_path: str) -> str:
    """
    Generates a beautifully formatted, notebook-styled PDF containing handwritten study notes,
    definitions, diagrams, and comprehensive Questions & Answers with model solutions.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=44,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Notebook Colors
    ink_blue = colors.HexColor("#1e3a8a") # Deep ink blue
    ink_dark = colors.HexColor("#0f172a")
    margin_red = colors.HexColor("#dc2626") # Red margin line
    rule_blue = colors.HexColor("#bfdbfe") # Ruled line color
    highlight_yellow = colors.HexColor("#fef08a") # Highlighter yellow
    highlight_cyan = colors.HexColor("#cffafe") # Highlighter cyan
    card_bg = colors.HexColor("#f8fafc")
    tip_bg = colors.HexColor("#fef3c7")

    title_style = ParagraphStyle(
        'NotebookTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=ink_blue
    )

    subtitle_style = ParagraphStyle(
        'NotebookSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#475569")
    )

    meta_style = ParagraphStyle(
        'NotebookMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748b")
    )

    sec_heading = ParagraphStyle(
        'NotebookSec',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.white
    )

    body_style = ParagraphStyle(
        'NotebookBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=ink_dark
    )

    q_title_style = ParagraphStyle(
        'NotebookQTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=ink_blue
    )

    ans_style = ParagraphStyle(
        'NotebookAns',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    tip_style = ParagraphStyle(
        'NotebookTip',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#92400e")
    )

    elements = []

    # Title & Notebook Header matching screenshot
    q_num = notes_data.get("question_number", "7.")
    q_title = notes_data.get("question_title") or notes_data.get("topic", "Explain the Levels/Tasks of NLP.")
    subject = notes_data.get("subject_name", "Natural Language Processing (SEM7)")
    source_fn = notes_data.get("source_filename", "nlp1.pdf (Page 18 Topper Notes)")
    doodle_left = notes_data.get("doodle_left", "⭐")
    doodle_right = notes_data.get("doodle_right", "📖✨")

    # Header Title Banner
    header_table = Table([[
        Paragraph(f"<font size=20>{doodle_left}</font>", ParagraphStyle('HLeft', parent=styles['Normal'], alignment=1)),
        Paragraph(f"<b><font color='#701a75' size=16>{q_num} {q_title}</font></b>", ParagraphStyle('HCenter', parent=styles['Normal'], alignment=1, leading=20)),
        Paragraph(f"<font size=18>{doodle_right}</font>", ParagraphStyle('HRight', parent=styles['Normal'], alignment=1))
    ]], colWidths=[40, 435, 40])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4))
    elements.append(HRFlowable(width="80%", thickness=2.5, color=colors.HexColor("#f472b6"), spaceBefore=2, spaceAfter=8))

    # SECTION 1 & 2: Introduction & Hierarchy Stack (2 Columns)
    intro_text = notes_data.get("introduction") or notes_data.get("core_summary", "")
    hierarchy = notes_data.get("hierarchy", [])

    if hierarchy or intro_text:
        left_flow = [
            Paragraph("<b><font color='#86198f' size=11>1) INTRODUCTION</font></b>", styles['Normal']),
            Spacer(1, 4),
            Paragraph(intro_text or "NLP performs a number of tasks in a sequence arranged in different hierarchical levels.", body_style)
        ]

        # Right: Hierarchy Stack
        right_flow = [
            Paragraph("<b><font color='#86198f' size=11>2) LEVELS OF NLP (HIERARCHY)</font></b>", styles['Normal']),
            Spacer(1, 4)
        ]

        if hierarchy:
            h_rows = []
            for idx, lvl in enumerate(hierarchy):
                lvl_name = lvl.get("name", "")
                lvl_desc = lvl.get("description", "")
                lvl_bg = colors.HexColor(lvl.get("color", "#f1f5f9"))
                lvl_border = colors.HexColor(lvl.get("borderColor", "#cbd5e1"))

                h_cell = Table([[
                    Paragraph(f"<b><font size=8.5 color='#1e293b'>{lvl_name}</font></b>", styles['Normal']),
                    Paragraph("<b>&rarr;</b>", ParagraphStyle('Arrow', parent=styles['Normal'], alignment=1, fontSize=9, textColor=colors.HexColor("#64748b"))),
                    Paragraph(f"<i><font size=8 color='#334155'>{lvl_desc}</font></i>", ParagraphStyle('HDesc', parent=styles['Normal'], alignment=2, leading=10))
                ]], colWidths=[100, 15, 145])
                h_cell.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), lvl_bg),
                    ('BOX', (0,0), (-1,-1), 0.8, lvl_border),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 3),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                    ('LEFTPADDING', (0,0), (-1,-1), 4),
                    ('RIGHTPADDING', (0,0), (-1,-1), 4),
                ]))
                h_rows.append([h_cell])
                if idx < len(hierarchy) - 1:
                    h_rows.append([Paragraph("<b>&uarr;</b>", ParagraphStyle('UpArr', parent=styles['Normal'], alignment=1, fontSize=8, textColor=colors.HexColor("#64748b")))])

            h_stack_table = Table(h_rows, colWidths=[265])
            h_stack_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 0.5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0.5),
            ]))
            right_flow.append(h_stack_table)

        two_col_table = Table([[left_flow, right_flow]], colWidths=[235, 280])
        two_col_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (0,0), 0),
            ('RIGHTPADDING', (0,0), (0,0), 12),
            ('LEFTPADDING', (1,0), (1,0), 10),
            ('RIGHTPADDING', (1,0), (1,0), 0),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        elements.append(two_col_table)
        elements.append(Spacer(1, 10))

    # SECTION 3: 4-Column Description Table matching screenshot
    tasks_table_data = notes_data.get("tasks_table", [])
    if tasks_table_data:
        elements.append(Paragraph("<b><font color='#86198f' size=11>3) DESCRIPTION OF LEVELS / TASKS</font></b>", styles['Normal']))
        elements.append(Spacer(1, 4))

        th_style = ParagraphStyle('THStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor("#0f172a"))
        table_rows = [[
            Paragraph("<b>Level / Task</b>", th_style),
            Paragraph("<b>Goal</b>", th_style),
            Paragraph("<b>Main Tasks</b>", th_style),
            Paragraph("<b>Example</b>", th_style)
        ]]

        for r_idx, r in enumerate(tasks_table_data):
            lvl_p = Paragraph(f"<b><font size=8.5 color='#1e293b'>{r.get('level', '')}</font></b>", styles['Normal'])
            goal_p = Paragraph(f"<font size=8 color='#334155'>{r.get('goal', '')}</font>", styles['Normal'])
            
            task_bullets = "<br/>".join([f"&bull; {t}" for t in r.get("main_tasks", [])])
            tasks_p = Paragraph(f"<font size=8 color='#1e293b'>{task_bullets}</font>", styles['Normal'])

            ex_flow = []
            if r.get("example_input"):
                ex_flow.append(Paragraph(f"<b><font color='#dc2626' size=7.5>Input :</font></b> <font size=7.5 color='#0f172a'>{r.get('example_input')}</font>", styles['Normal']))
            if r.get("example_output"):
                ex_flow.append(Paragraph(f"<b><font color='#4f46e5' size=7.5>Output :</font></b> <font size=7.5 color='#0f172a'>{r.get('example_output')}</font>", styles['Normal']))
            
            table_rows.append([lvl_p, goal_p, tasks_p, ex_flow])

        desc_table = Table(table_rows, colWidths=[105, 115, 140, 155])
        desc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
            ('GRID', (0,0), (-1,-1), 0.8, colors.HexColor("#94a3b8")),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#fafafa")])
        ]))
        elements.append(desc_table)
        elements.append(Spacer(1, 10))

    # SECTION 4: NLP as a Pipeline of Tasks (Flowchart)
    pipeline = notes_data.get("pipeline", [])
    if pipeline:
        elements.append(Paragraph("<b><font color='#86198f' size=11>4) NLP AS A PIPELINE OF TASKS</font></b>", styles['Normal']))
        elements.append(Spacer(1, 4))

        pipe_cells = []
        col_w = []
        cell_width = 515 / (len(pipeline) * 2 - 1) if pipeline else 515

        for p_idx, p in enumerate(pipeline):
            step_name = p.get("step", "")
            p_bg = colors.HexColor(p.get("color", "#f1f5f9"))
            p_border = colors.HexColor(p.get("borderColor", "#94a3b8"))

            p_box = Table([[Paragraph(f"<b><font size=7 color='#1e293b'>{step_name}</font></b>", ParagraphStyle('PipeP', parent=styles['Normal'], alignment=1, leading=8))]], colWidths=[55])
            p_box.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), p_bg),
                ('BOX', (0,0), (-1,-1), 0.8, p_border),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            pipe_cells.append(p_box)
            col_w.append(58)

            if p_idx < len(pipeline) - 1:
                pipe_cells.append(Paragraph("<b>&rarr;</b>", ParagraphStyle('PArr', parent=styles['Normal'], alignment=1, fontSize=8, textColor=colors.HexColor("#64748b"))))
                col_w.append(18)

        pipe_table = Table([pipe_cells], colWidths=col_w)
        pipe_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        elements.append(pipe_table)
        elements.append(Spacer(1, 3))

        pipe_caption = notes_data.get("pipeline_caption", "Output of one level is input to the next level")
        elements.append(Paragraph(f"<i><font size=8 color='#64748b'>&bull; {pipe_caption} &bull;</font></i>", ParagraphStyle('PipeCap', parent=styles['Normal'], alignment=1)))
        elements.append(Spacer(1, 10))

    # SECTION 5: Key Points & End to End Example Callouts
    key_points = notes_data.get("key_points", [])
    e2e = notes_data.get("end_to_end_example", {})

    if key_points or e2e:
        left_callout_flow = [
            Paragraph("<b><font color='#be185d' size=10>Key Points &#x1F338;</font></b>", styles['Normal']),
            Spacer(1, 3)
        ]
        for kp in key_points:
            left_callout_flow.append(Paragraph(f"&bull; <font size=8 color='#831843'>{kp}</font>", styles['Normal']))

        left_callout_table = Table([[left_callout_flow]], colWidths=[245])
        left_callout_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fff5f7")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#f472b6")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))

        right_callout_flow = [
            Paragraph("<b><font color='#854d0e' size=10>Example (End to End) &#x1F338;</font></b>", styles['Normal']),
            Spacer(1, 3)
        ]
        if e2e and isinstance(e2e, dict):
            inp_sent = e2e.get("input_sentence", "\"Yesterday, John gave Mary a book.\"")
            right_callout_flow.append(Paragraph(f"<b><font color='#dc2626' size=7.5>Input :</font></b> <font size=7.5 color='#0f172a'>{inp_sent}</font>", styles['Normal']))
            for st in e2e.get("steps", []):
                right_callout_flow.append(Paragraph(f"<b><font color='#854d0e' size=7.5>{st.get('stage')}:</font></b> <font size=7.5 color='#713f12'>{st.get('desc')}</font>", styles['Normal']))

        right_callout_table = Table([[right_callout_flow]], colWidths=[255])
        right_callout_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef9c3")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#fde047")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))

        callouts_row = Table([[left_callout_table, right_callout_table]], colWidths=[255, 260])
        callouts_row.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (0,0), 0),
            ('RIGHTPADDING', (0,0), (0,0), 6),
            ('LEFTPADDING', (1,0), (1,0), 6),
            ('RIGHTPADDING', (1,0), (1,0), 0),
        ]))
        elements.append(callouts_row)
        elements.append(Spacer(1, 10))

    # SECTION 6: Key Definitions & Governing Formulas
    defs = notes_data.get("definitions_and_formulas", [])
    if defs:
        sec_bar = Table([[Paragraph("<b>KEY DEFINITIONS, LAWS & FORMULAS (MUST-MEMORIZE)</b>", sec_heading)]], colWidths=[515])
        sec_bar.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0891b2")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(sec_bar)
        elements.append(Spacer(1, 6))

        def_rows = []
        for d in defs:
            term = d.get("term", "")
            formula = d.get("formula_or_rule", "")
            explanation = d.get("explanation", "")
            
            p_flow = [
                Paragraph(f"<b>&bull; {term}</b>: {explanation}", body_style)
            ]
            if formula:
                p_flow.append(Spacer(1, 2))
                p_flow.append(Paragraph(f"<b>Formula / Rule:</b> <font color='#1e3a8a'><b>{formula}</b></font>", tip_style))

            def_rows.append([p_flow])

        if def_rows:
            d_table = Table(def_rows, colWidths=[515])
            d_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BACKGROUND', (0,0), (-1,-1), card_bg),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('LINEBELOW', (0,0), (-1,-1), 0.5, rule_blue)
            ]))
            elements.append(d_table)
            elements.append(Spacer(1, 10))

    # SECTION 4: Comprehensive Extracted Questions & Answers
    qas = notes_data.get("questions_and_answers", [])
    if qas:
        sec_bar = Table([[Paragraph(f"<b>4. EXHAUSTIVE QUESTIONS & ANSWERS &bull; ({len(qas)} Questions)</b>", sec_heading)]], colWidths=[515])
        sec_bar.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#d97706")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(sec_bar)
        elements.append(Spacer(1, 6))

        # Group Q&As by marks
        for idx, q in enumerate(qas, 1):
            q_num = f"Q{idx}"
            q_text = q.get("question", "")
            q_marks = q.get("marks", 5)
            q_type = q.get("question_type", "Concept")
            q_ans = q.get("model_answer", "") or ""
            q_bullets = q.get("answer_bullets", [])
            q_tip = q.get("key_exam_tip", "")
            q_imp = q.get("importance", "")

            q_flow = [
                Paragraph(f"<b>{q_num}. {q_text}</b> <font color='#d97706'><b>[{q_marks} Marks &bull; {q_type}]</b></font> {q_imp}", q_title_style),
                Spacer(1, 3)
            ]

            if q_bullets:
                for b in q_bullets:
                    q_flow.append(Paragraph(f"&bull; {b}", ans_style))
                q_flow.append(Spacer(1, 2))
            elif q_ans:
                q_flow.append(Paragraph(q_ans.replace('\n', '<br/>'), ans_style))
                q_flow.append(Spacer(1, 2))

            if q_tip:
                q_flow.append(Paragraph(f"⚡ <b>Examiner Tip:</b> {q_tip}", tip_style))

            q_card = Table([[q_flow]], colWidths=[515])
            q_card.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.white),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ('LINELEFT', (0,0), (-1,-1), 3, margin_red if q_marks >= 10 else ink_blue),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0"))
            ]))
            elements.append(q_card)
            elements.append(Spacer(1, 6))

    # SECTION 5: Mnemonics & Exam Day Revision
    mnemonics = notes_data.get("mnemonics_and_tricks", [])
    if mnemonics:
        elements.append(Spacer(1, 6))
        sec_bar = Table([[Paragraph("<b>5. HIGH-YIELD MEMORY TRICKS & MNEMONICS</b>", sec_heading)]], colWidths=[515])
        sec_bar.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#16a34a")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(sec_bar)
        elements.append(Spacer(1, 6))

        m_rows = []
        for m in mnemonics:
            m_rows.append([Paragraph(f"💡 <b>{m}</b>", body_style)])

        m_table = Table(m_rows, colWidths=[515])
        m_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), highlight_yellow),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#fde047"))
        ]))
        elements.append(m_table)

    elements.append(Spacer(1, 14))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#94a3b8"), spaceBefore=4, spaceAfter=6))
    elements.append(Paragraph("<b>EXAMFRIEND &bull; Handwritten Study Notes &bull; Review Daily & Ace Every Exam</b>", ParagraphStyle('NotesEnd', parent=subtitle_style, fontSize=8.5, textColor=colors.HexColor("#94a3b8"))))

    doc.build(elements)
    return output_path


# ----------------- CARD 7: PRINTABLE FLASHCARD DECK PDF ----------------- #

def generate_flashcards_pdf(deck_data: Dict[str, Any], output_path: str) -> str:
    """
    Generates a beautifully structured, printable PDF of flashcards
    formatted with card outlines, cut guides, questions, answers, and examiner tips.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title = deck_data.get("title", "Exam Study Flashcards")
    subject = deck_data.get("subject_name", "General Examination")
    cards = deck_data.get("cards", [])

    header_style = ParagraphStyle(
        'DeckHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b")
    )

    meta_style = ParagraphStyle(
        'DeckMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b")
    )

    card_q_style = ParagraphStyle(
        'CardQ',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1e3a8a")
    )

    card_a_style = ParagraphStyle(
        'CardA',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1f2937")
    )

    card_tip_style = ParagraphStyle(
        'CardTip',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#92400e")
    )

    elements = []

    # Title Banner Table
    banner_data = [
        [Paragraph(f"⚡ <b>EXAMFRIEND &bull; ACTIVE RECALL FLASHCARDS</b>", ParagraphStyle('TopBanner', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor("#4f46e5")))],
        [Paragraph(title, header_style)],
        [Paragraph(f"<b>Subject:</b> {subject} &bull; <b>Cards:</b> {len(cards)} &bull; <b>Generated:</b> {datetime.date.today().strftime('%b %d, %Y')}", meta_style)]
    ]
    banner_table = Table(banner_data, colWidths=[520])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#e2e8f0")),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 14))

    # Render Cards in 2-Card Blocks
    for idx, card in enumerate(cards):
        q_text = card.get("question", "")
        a_text = card.get("answer", "").replace("\n", "<br/>")
        tip = card.get("exam_tip", "")
        cat = card.get("category", "Concept")
        diff = card.get("difficulty", "Medium")

        diff_color = "#10b981" if diff == "Easy" else ("#f59e0b" if diff == "Medium" else "#ef4444")

        card_content = [
            [
                Paragraph(f"<b>CARD #{idx + 1}</b> &bull; <b>[{cat.upper()}]</b>", ParagraphStyle('CardNum', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#4f46e5"))),
                Paragraph(f"<b>Difficulty:</b> {diff}", ParagraphStyle('DiffP', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor(diff_color), alignment=2))
            ],
            [Paragraph(f"<b>Q:</b> {q_text}", card_q_style), ""],
            [Paragraph(f"<b>A:</b><br/>{a_text}", card_a_style), ""]
        ]
        if tip:
            card_content.append([Paragraph(f"💡 <i>{tip}</i>", card_tip_style), ""])

        card_table = Table(card_content, colWidths=[380, 140])
        card_table.setStyle(TableStyle([
            ('SPAN', (0, 1), (1, 1)),
            ('SPAN', (0, 2), (1, 2)),
            ('SPAN', (0, 3), (1, 3)) if tip else ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ffffff")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('LINEBELOW', (0,0), (1,0), 0.5, colors.HexColor("#e2e8f0")),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))

        elements.append(card_table)
        elements.append(Spacer(1, 10))

    elements.append(Spacer(1, 10))
    elements.append(Paragraph("<b>EXAMFRIEND &bull; Cut along lines for pocket active-recall flashcards &bull; Ace Every Exam</b>", ParagraphStyle('EndF', fontName='Helvetica', fontSize=8, textColor=colors.HexColor("#94a3b8"), alignment=1)))

    doc.build(elements)
    return output_path

