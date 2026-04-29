"""
Test script to verify resume upload endpoint
"""
import requests
import os

# Create a simple test PDF file
test_pdf_path = "test_resume.pdf"

# Create a minimal valid PDF
minimal_pdf_content = b"""%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Times-Roman>>endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
345
%%EOF"""

# Write test PDF
with open(test_pdf_path, 'wb') as f:
    f.write(minimal_pdf_content)

print(f"Created test PDF: {test_pdf_path}")

# Test the upload endpoint
url = "http://localhost:8000/api/parse-resume"

with open(test_pdf_path, 'rb') as f:
    files = {'file': ('test_resume.pdf', f, 'application/pdf')}
    
    print(f"\nUploading to {url}...")
    response = requests.post(url, files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

# Clean up
if os.path.exists(test_pdf_path):
    os.remove(test_pdf_path)
    print(f"\nCleaned up test file: {test_pdf_path}")
