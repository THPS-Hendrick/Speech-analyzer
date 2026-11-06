from http.server import BaseHTTPRequestHandler
import json
from wordfreq import zipf_frequency, tokenize

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body)
        text = data.get('text', '')

        # Tokenize handles punctuation and splits words cleanly
        words = tokenize(text, 'en')
        scored_words = {}
        total_score = 0
        valid_words = 0

        # Score only unique words to save compute time
        for word in set(words):
            score = zipf_frequency(word, 'en')
            if score > 0:
                scored_words[word] = score
                total_score += score
                valid_words += 1

        avg = (total_score / valid_words) if valid_words > 0 else 0

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(json.dumps({
            'averageFamiliarity': round(avg, 2),
            'wordScores': scored_words
        }).encode())
