from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from datetime import datetime
import random

# All possible damage classes
ALL_DEFECTS = [
    "Bonnet",
    "Bumper",
    "Dickey",
    "Door",
    "Fender",
    "Light",
    "Windshield"
]

# Dynamic remarks based on severity
REMARKS = {
    "PASS": [
        "The vehicle was inspected using AI-assisted visual analysis across multiple views. No visible exterior or structural defects were detected. The vehicle appears to be in excellent condition.",
        "Comprehensive multi-angle inspection complete: No damage found on any inspected components. Vehicle is in outstanding visual condition.",
        "No visible defects detected in any of the provided images. Overall vehicle condition is satisfactory."
    ],
    "ATTENTION": [
        "Minor exterior defects were detected in one or more views. These are likely cosmetic and do not pose immediate safety risks. Preventive maintenance is recommended.",
        "A few minor issues were identified across the inspected images. While the vehicle remains roadworthy, attention to these areas is advised.",
        "Some light damage detected. Issues appear minor and cosmetic in nature. Early repair suggested to maintain optimal condition."
    ],
    "FAIL": [
        "Multiple or significant defects were detected across various components and views. These may affect safety, aesthetics, or functionality. Professional repair and re-inspection are strongly recommended.",
        "The vehicle does not pass visual inspection standards due to detected damage in multiple areas. Corrective action required before approval or further use.",
        "Several defects identified in the provided images. Comprehensive repair by a qualified technician is required."
    ]
}

def generate_report(defects: list, image_paths: list, output_path: str, vehicle_info: dict = None):
    """
    Generate PDF report with vehicle inspection results.
    
    Args:
        defects: List of (component, confidence) tuples
        image_paths: List of absolute paths to annotated images
        output_path: Path where PDF should be saved
        vehicle_info: Dictionary with keys: vin, make, model, year, mileage
    """
    if vehicle_info is None:
        vehicle_info = {
            "vin": "Not Provided",
            "make": "Not Provided",
            "model": "Not Provided",
            "year": "Not Provided",
            "mileage": "Not Provided"
        }
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "BigTitle",
        parent=styles["Title"],
        fontSize=24,
        spaceAfter=20,
        alignment=1,  # center
        textColor=colors.HexColor("#1e3a8a")
    )
    story.append(Paragraph("VEHICLE INSPECTION REPORT", title_style))
    story.append(Paragraph(f"Inspection Date: {datetime.now().strftime('%B %d, %Y')}", styles["Normal"]))
    story.append(Spacer(1, 20))

    # Vehicle Info Table - now with actual data
    make_model = f"{vehicle_info['make']} {vehicle_info['model']}".strip()
    if make_model == "Not Provided Not Provided":
        make_model = "Not Provided"
    
    info_data = [
        ["VIN / Registration", vehicle_info["vin"], "Mileage", vehicle_info["mileage"]],
        ["Make / Model", make_model, "Year", vehicle_info["year"]]
    ]
    info_table = Table(info_data, colWidths=[5*cm, 5*cm, 4*cm, 4*cm])
    info_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.grey),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 30))

    # Annotated Images Section
    story.append(Paragraph("<b>Vehicle Images with AI-Detected Damage</b>", styles["Heading2"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Damage areas are highlighted with red bounding boxes and confidence labels.", styles["Italic"]))
    story.append(Spacer(1, 20))

    if not image_paths:
        story.append(Paragraph("<i>No images were processed.</i>", styles["Normal"]))
    else:
        for idx, img_path in enumerate(image_paths):
            view_labels = ["Front View", "Side View", "Rear View", "Additional View"]
            view_name = view_labels[idx] if idx < len(view_labels) else f"View {idx + 1}"
            story.append(Paragraph(f"<b>{view_name}</b>", styles["Heading3"]))
            story.append(Spacer(1, 8))

            img = Image(img_path, width=17*cm, height=10.5*cm)
            img.hAlign = 'CENTER'
            story.append(img)
            story.append(Spacer(1, 30))

            if idx < len(image_paths) - 1:
                story.append(PageBreak())

    # Damage Checklist Section
    story.append(Paragraph("<b>Damage Inspection Checklist</b>", styles["Heading2"]))
    story.append(Spacer(1, 10))

    detected_set = {defect.lower() for defect, _ in defects}
    total_detected_types = len(detected_set)

    table_data = [["Component", "Status", "Highest Confidence", "Remarks"]]

    for defect in ALL_DEFECTS:
        clean_name = defect.lower()
        if clean_name in detected_set:
            confidences = [c for d, c in defects if d.lower() == clean_name]
            highest_conf = max(confidences) if confidences else 0
            confidence_str = f"{highest_conf:.1f}%"
            status = "✓ Detected"
            remarks = "Damage detected by AI"
        else:
            status = "☐ No Damage"
            confidence_str = "-"
            remarks = "No issues detected"

        table_data.append([
            Paragraph(f"<b>{defect}</b>", styles["Normal"]),
            Paragraph(f"<font color='#166534'>{status}</font>" if "Detected" in status else status, styles["Normal"]),
            Paragraph(confidence_str, styles["Normal"]),
            Paragraph(remarks, styles["Normal"])
        ])

    # Determine overall status
    if total_detected_types == 0:
        overall_status = "PASS"
        status_color = "#166534"
        remark_category = "PASS"
    elif total_detected_types <= 2:
        overall_status = "ATTENTION"
        status_color = "#d97706"
        remark_category = "ATTENTION"
    else:
        overall_status = "FAIL"
        status_color = "#991b1b"
        remark_category = "FAIL"

    # Summary row
    table_data.append([
        Paragraph("<b>Total Unique Defects</b>", styles["Normal"]),
        Paragraph(f"<font color='{status_color}'><b>{total_detected_types}</b></font>", styles["Normal"]),
        Paragraph("<b>Overall Status:</b>", styles["Normal"]),
        Paragraph(f"<font color='{status_color}' size=14><b>{overall_status}</b></font>", styles["Normal"])
    ])

    defect_table = Table(table_data, colWidths=[5.5*cm, 3.8*cm, 4.0*cm, 5.2*cm])

    defect_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.8, colors.grey),
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 11),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,0), 'MIDDLE'),

        ('FONTSIZE', (0,1), (-1,-1), 10.5),
        ('ALIGN', (0,1), (-1,-1), 'LEFT'),
        ('VALIGN', (0,1), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),

        # Center the confidence column
        ('ALIGN', (2,1), (2,-1), 'CENTER'),
    ]))

    story.append(defect_table)
    story.append(Spacer(1, 30))

    # Summary & Recommendations
    remark_text = random.choice(REMARKS[remark_category])
    remark_style = ParagraphStyle(
        "Remarks",
        parent=styles["Normal"],
        fontSize=11.5,
        spaceBefore=15,
        spaceAfter=20,
        leftIndent=10,
        textColor=colors.HexColor("#333333"),
        leading=16
    )
    story.append(Paragraph("<b>Inspection Summary & Recommendations:</b>", styles["Heading3"]))
    story.append(Paragraph(remark_text, remark_style))

    # Disclaimer
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.grey,
        alignment=1,
        spaceBefore=30
    )
    story.append(Paragraph(
        "<i>Note: This report was generated using AI-powered computer vision technology. "
        "Results are based on the provided images and should be verified by a qualified technician "
        "for critical decisions or insurance purposes.</i>",
        disclaimer_style
    ))

    doc.build(story)