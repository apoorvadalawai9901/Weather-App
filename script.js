const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
const API_ROOT = "https://api.openweathermap.org/data/2.5";
const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const locationButton = document.querySelector("#location-button");
const notice = document.querySelector("#notice");
const loading = document.querySelector("#loading");
const forecastGrid = document.querySelector("#forecast-grid");
let activeRequest;

const elements = {
  city: document.querySelector("#city-name"),
  country: document.querySelector("#country-line"),
  temperature: document.querySelector("#temperature"),
  condition: document.querySelector("#condition"),
  icon: document.querySelector("#current-icon"),
  feelsLike: document.querySelector("#feels-like"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#wind-speed"),
  visibility: document.querySelector("#visibility"),
  pressure: document.querySelector("#pressure"),
  updated: document.querySelector("#updated-at"),
  today: document.querySelector("#today-label")
};

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city) loadWeather(`q=${encodeURIComponent(city)}`);
});

locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Location is not supported by this browser. Search for a city instead.");
    return;
  }

  setLoading(true);
  clearError();
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => loadWeather(`lat=${coords.latitude}&lon=${coords.longitude}`),
    (error) => {
      setLoading(false);
      const message = error.code === error.PERMISSION_DENIED
        ? "Location access was declined. Search for a city instead."
        : "We couldn't get your location. Check your connection or search for a city.";
      showError(message);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});

async function loadWeather(query) {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showError("Add your OpenWeatherMap API key in script.js to load live weather.");
    return;
  }

  activeRequest?.abort();
  activeRequest = new AbortController();
  setLoading(true);
  clearError();

  try {
    const [current, forecast] = await Promise.all([
      fetchWeather(`${API_ROOT}/weather?${query}&units=metric&appid=${API_KEY}`, activeRequest.signal),
      fetchWeather(`${API_ROOT}/forecast?${query}&units=metric&appid=${API_KEY}`, activeRequest.signal)
    ]);
    renderCurrent(current);
    renderForecast(forecast);
  } catch (error) {
    if (error.name !== "AbortError") showError(error.message);
  } finally {
    if (!activeRequest.signal.aborted) setLoading(false);
  }
}

async function fetchWeather(url, signal) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Couldn't reach the weather service. Check your internet connection and try again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) throw new Error("We couldn't find that city. Check the spelling and try again.");
    if (response.status === 401) throw new Error("The API key is invalid or not active yet. Check your key in script.js.");
    if (response.status === 429) throw new Error("The weather service is busy. Please wait a moment and try again.");
    throw new Error(data.message ? `Weather service error: ${data.message}.` : "Weather data is temporarily unavailable. Please try again.");
  }
  return data;
}

function renderCurrent(data) {
  const iconCode = data.weather[0].icon;
  elements.city.textContent = data.name;
  elements.country.textContent = `${countryName(data.sys.country)}  ·  ${dateLabel(data.dt, data.timezone)}`;
  elements.temperature.textContent = Math.round(data.main.temp);
  elements.condition.textContent = data.weather[0].description;
  elements.icon.src = iconUrl(iconCode, "@2x");
  elements.icon.alt = `${data.weather[0].description} icon`;
  elements.icon.hidden = false;
  elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°`;
  elements.humidity.innerHTML = `${data.main.humidity}<small>%</small>`;
  elements.wind.innerHTML = `${Math.round(data.wind.speed * 3.6)}<small> km/h</small>`;
  elements.visibility.innerHTML = `${(data.visibility / 1000).toFixed(1)}<small> km</small>`;
  elements.pressure.innerHTML = `${data.main.pressure}<small> hPa</small>`;
  elements.updated.textContent = `Updated ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date((data.dt + data.timezone) * 1000))} local time`;
  elements.today.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date((data.dt + data.timezone) * 1000)).toUpperCase() + " · CURRENT WEATHER";
}

function renderForecast(data) {
  const days = new Map();

  for (const entry of data.list) {
    const localDate = new Date((entry.dt + data.city.timezone) * 1000);
    const dateKey = localDate.toISOString().slice(0, 10);
    const hour = localDate.getUTCHours();
    const existing = days.get(dateKey);
    if (!existing || Math.abs(hour - 12) < Math.abs(existing.hour - 12)) {
      days.set(dateKey, { entry, date: localDate, hour });
    }
  }

  const dailyForecasts = [...days.values()].slice(0, 5);
  forecastGrid.replaceChildren();
  for (const day of dailyForecasts) {
    const item = document.createElement("article");
    item.className = "forecast-day";

    const label = document.createElement("span");
    label.className = "forecast-name";
    label.textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(day.date);

    const icon = document.createElement("img");
    icon.src = iconUrl(day.entry.weather[0].icon);
    icon.alt = "";

    const condition = document.createElement("span");
    condition.className = "forecast-condition";
    condition.textContent = day.entry.weather[0].description;

    const temperatures = document.createElement("div");
    temperatures.className = "forecast-temps";
    const high = document.createElement("span");
    high.textContent = `${Math.round(day.entry.main.temp_max)}°`;
    const low = document.createElement("span");
    low.textContent = `${Math.round(day.entry.main.temp_min)}°`;
    temperatures.append(high, low);
    item.append(label, icon, condition, temperatures);
    forecastGrid.append(item);
  }
}

function iconUrl(code, size = "") {
  return `https://openweathermap.org/img/wn/${code}${size}.png`;
}

function countryName(code) {
  try {
    return new Intl.DisplayNames([navigator.language], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function dateLabel(timestamp, offset) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date((timestamp + offset) * 1000));
}

function setLoading(isLoading) {
  loading.hidden = !isLoading;
  loading.setAttribute("aria-hidden", String(!isLoading));
  locationButton.disabled = isLoading;
}

function showError(message) {
  notice.textContent = message;
  notice.hidden = false;
}

function clearError() {
  notice.textContent = "";
  notice.hidden = true;
}