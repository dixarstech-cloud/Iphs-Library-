"""Builds the one-file app: index.html (CSS, JavaScript, book data and images all inside).

index.html works from anywhere, including phones that open it from a file manager or
a download, where the files next to it are not available.
Edit index.src.html, styles.css, app.js or data.js (or run build_data.py first), then run:
    python build_single.py
"""
import base64, os, re
here = os.path.dirname(os.path.abspath(__file__))
read = lambda n: open(os.path.join(here, n), encoding="utf-8").read()
mime = {".png": "image/png", ".jpg": "image/jpeg"}

def data_uri(name):
    ext = os.path.splitext(name)[1]
    with open(os.path.join(here, name), "rb") as f:
        return f"data:{mime[ext]};base64," + base64.b64encode(f.read()).decode()

images = ["logo.png", "front.jpg", "library.jpg", "texture.jpg"]
def inline_images(text):
    for n in images:
        text = text.replace(f'"{n}"', f'"{data_uri(n)}"')      # "logo.png" in HTML / JS / CSS url("...")
    return text

safe = lambda s: re.sub(r"</(script)", r"<\\/\1", s, flags=re.I)
html = read("index.src.html")
html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + inline_images(read("styles.css")) + "\n</style>")
html = html.replace('<script src="data.js"></script>', "<script>\n" + safe(read("data.js")) + "\n</script>")
html = html.replace('<script src="guide.js"></script>', "<script>\n" + safe(read("guide.js")) + "\n</script>")
html = html.replace('<script src="app.js"></script>', "<script>\n" + safe(inline_images(read("app.js"))) + "\n</script>")
html = inline_images(html)
with open(os.path.join(here, "index.html"), "w", encoding="utf-8") as f:
    f.write(html)
print(f"index.html written ({len(html)/1024:.0f} KB)")
