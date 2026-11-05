const zones = [
  { city: 'New York', zone: 'America/New_York' },
  { city: 'Los Angeles', zone: 'America/Los_Angeles' },
  { city: 'London', zone: 'Europe/London' },
  { city: 'Paris', zone: 'Europe/Paris' },
  { city: 'Dubai', zone: 'Asia/Dubai' },
  { city: 'Tokyo', zone: 'Asia/Tokyo' },
  { city: 'Sydney', zone: 'Australia/Sydney' },
  { city: 'Auckland', zone: 'Pacific/Auckland' },
  { city: 'Honolulu', zone: 'Pacific/Honolulu' },
  { city: 'Chicago', zone: 'America/Chicago' },
  { city: 'Toronto', zone: 'America/Toronto' },
  { city: 'Singapore', zone: 'Asia/Singapore' },
  { city: 'Seoul', zone: 'Asia/Seoul' },
  { city: 'Mumbai', zone: 'Asia/Kolkata' },
  { city: 'São Paulo', zone: 'America/Sao_Paulo' },
];

const clockContainer = document.querySelector('#clocks');
const select = document.querySelector('#timezone-select');
const addButton = document.querySelector('#add-city');
const message = document.querySelector('#message');
const selected = new Set(['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']);
const clockFormatters = new Map();
const dateFormatters = new Map();

for (const item of zones) {
  const option = document.createElement('option');
  option.value = item.zone;
  option.textContent = `${item.city} — ${item.zone.replaceAll('_', ' ')}`;
  select.append(option);
}

function getFormatter(cache, zone, options) {
  if (!cache.has(zone)) cache.set(zone, new Intl.DateTimeFormat(undefined, { timeZone: zone, ...options }));
  return cache.get(zone);
}

function renderCards() {
  clockContainer.replaceChildren();
  for (const zone of selected) {
    const item = zones.find((city) => city.zone === zone);
    if (!item) continue;
    const card = document.createElement('article');
    card.className = 'clock-card';
    card.innerHTML = `
      <div class="card-top">
        <div><h2 class="city">${item.city}</h2><p class="zone">${item.zone.replaceAll('_', ' ')}</p></div>
        <button class="remove" type="button" aria-label="Remove ${item.city}">Remove</button>
      </div>
      <time></time><p class="card-date"></p>`;
    card.dataset.zone = zone;
    card.querySelector('.remove').addEventListener('click', () => {
      selected.delete(zone);
      message.textContent = `${item.city} removed.`;
      renderCards();
      updateClocks();
    });
    clockContainer.append(card);
  }
  updateClocks();
}

function updateClocks() {
  const now = new Date();
  document.querySelector('#utc-time').textContent = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now);
  document.querySelector('#utc-date').textContent = new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  }).format(now);

  for (const card of clockContainer.querySelectorAll('.clock-card')) {
    const zone = card.dataset.zone;
    card.querySelector('time').textContent = getFormatter(clockFormatters, zone, {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
    card.querySelector('.card-date').textContent = getFormatter(dateFormatters, zone, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(now);
  }
}

addButton.addEventListener('click', () => {
  const zone = select.value;
  if (!zone) {
    message.textContent = 'Choose a city first.';
    return;
  }
  if (selected.has(zone)) {
    message.textContent = 'That city is already on your clock list.';
    return;
  }
  selected.add(zone);
  message.textContent = `${zones.find((item) => item.zone === zone).city} added.`;
  select.value = '';
  renderCards();
});

select.addEventListener('change', () => { message.textContent = ''; });
renderCards();
setInterval(updateClocks, 1000);
