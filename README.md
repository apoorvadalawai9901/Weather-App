# Weather App

A responsive weather dashboard built with HTML, CSS, and vanilla JavaScript. It uses the OpenWeatherMap API for current conditions and a 5-day forecast.

## Configure the API key

1. Create a free account at [OpenWeatherMap](https://openweathermap.org/) and generate an API key from your account dashboard.
2. Open `script.js` and replace `YOUR_OPENWEATHERMAP_API_KEY` near the top with your key.
3. Newly created keys can take a little while to become active. If the app reports an API error right after setup, wait and try again.

This is a static browser app, so the key is sent to the browser and can be seen by visitors. Use a restricted key where possible, and do not publish a real key in a public GitHub repository. For a public or production app, put API requests behind a server or serverless function and keep the key there.

## Run locally

You can open `index.html` directly, but running a local web server is recommended and is needed for browser geolocation in most browsers.

With Python installed, run this from the project directory:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000). Allow location access when prompted to use **Use my location**. City search works without location permission.

## Push to GitHub

Create an empty repository on GitHub, then run these commands from the project directory (replace the URL with your repository URL):

```bash
git init
git add index.html style.css script.js README.md
git commit -m "Build responsive weather dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Before pushing to a public repository, remove your real API key from `script.js` and restore the placeholder. Anyone can inspect a key included in client-side code.