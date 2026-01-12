# Import the tools we need from Flask
from flask import Flask, render_template, send_from_directory
import os

# Create our Flask app
app = Flask(__name__)
app.secret_key = "fitnation_secret_key"

# Home page - shows the landing page
@app.route('/')
def home():
    return render_template('landing.html')

# Engine page - where users fill the fitness form
@app.route('/engine')
def engine():
    return render_template('engine.html')

# Results page - shows the analysis results
@app.route('/results')
def results():
    return render_template('results.html')

# Handle static files like CSS and JavaScript
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# Start the server when this file is run directly
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
