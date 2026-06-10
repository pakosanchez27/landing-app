document.addEventListener('"'"'DOMContentLoaded'"'"', async () => {
    const mapElement = document.getElementById('"'"'landing-map'"'"');
    const loadingElement = document.getElementById('"'"'landing-map-loading'"'"');
    const countElement = document.getElementById('"'"'landing-map-count'"'"');
    const filtersElement = document.getElementById('"'"'landing-map-filters'"'"');

    if (!mapElement || typeof L === '"'"'undefined'"'"') {
        return;
    }

    const map = L.map(mapElement, {
        zoomControl: true,
        scrollWheelZoom: false,
    }).setView([19.4006, -99.0148], 13);

    L.tileLayer('"'"'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"'"', {
        maxZoom: 19,
        attribution: '"'"'&copy; OpenStreetMap'"'"',
    }).addTo(map);

    const colorByCategory = (category) => {
        const normalized = String(category || '"'"''"'"').toLowerCase();

        if (normalized.includes('"'"'establecimiento'"'"')) return '"'"'#63102a'"'"';
        if (normalized.includes('"'"'evento'"'"')) return '"'"'#bc955c'"'"';
        if (normalized.includes('"'"'mercado'"'"')) return '"'"'#235b4e'"'"';
        if (normalized.includes('"'"'hospital'"'"')) return '"'"'#d97706'"'"';
        return '"'"'#8b5cf6'"'"';
    };

    const escapeHtml = (value) => String(value ?? '"'"''"'"')
        .replace(/&/g, '"'"'&amp;'"'"')
        .replace(/</g, '"'"'&lt;'"'"')
        .replace(/>/g, '"'"'&gt;'"'"')
        .replace(/"/g, '"'"'&quot;'"'"')
        .replace(/'"'"'/g, '"'"'&#039;'"'"');

    try {
        const response = await fetch('"'"'/api/puntos-mapa'"'"', {
            headers: {
                Accept: '"'"'application/json'"'"',
            },
        });

        if (!response.ok) {
            throw new Error('"'"'No se pudieron cargar los puntos del mapa.'"'"');
        }

        const items = await response.json();
        const validItems = Array.isArray(items)
            ? items.filter((item) =>
                Array.isArray(item.position) &&
                item.position.length === 2 &&
                Number.isFinite(Number(item.position[0])) &&
                Number.isFinite(Number(item.position[1])))
            : [];

        const bounds = [];
        const markerEntries = [];
        const categories = Array.from(new Set(validItems
            .map((item) => String(item.category || '"'"'Otros'"'"').trim())
            .filter(Boolean)))
            .sort((a, b) => a.localeCompare(b, '"'"'es'"'"'));

        validItems.forEach((item) => {
            const lat = Number(item.position[0]);
            const lng = Number(item.position[1]);
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: '"'"''"'"',
                    html: `<span class="landing-map-marker" style="display:block;background:${colorByCategory(item.category)}"></span>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                }),
            });

            const popup = `
                <div class="space-y-2">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#bc955c;">
                        ${escapeHtml(item.category || '"'"'Punto de interes'"'"')}
                    </p>
                    <h3 style="margin:0;font-size:16px;font-weight:800;color:#201815;">
                        ${escapeHtml(item.name || '"'"'Ubicacion'"'"')}
                    </h3>
                    ${item.address ? `<p style="margin:0;font-size:13px;line-height:1.5;color:rgba(79,12,34,.8);">${escapeHtml(item.address)}</p>` : '"'"''"'"'}
                    ${item.description ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:rgba(79,12,34,.7);">${escapeHtml(item.description)}</p>` : '"'"''"'"'}
                </div>
            `;

            marker.bindPopup(popup);
            marker.addTo(map);
            markerEntries.push({
                marker,
                item,
                category: String(item.category || '"'"'Otros'"'"').trim() || '"'"'Otros'"'"',
                position: [lat, lng],
            });
            bounds.push([lat, lng]);
        });

        const renderCount = (total) => {
            if (countElement) {
                countElement.textContent = `${total} puntos`;
            }
        };

        const setActiveFilterStyles = (button, active) => {
            button.className = active
                ? '"'"'flex items-center gap-2 rounded-2xl bg-[#63102a] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#63102a]/20 transition'"'"'
                : '"'"'flex items-center gap-2 rounded-2xl border border-[#63102a]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#201815] shadow-sm transition hover:border-[#63102a]/20 hover:bg-[#fff9ef]'"'"';
        };

        const applyFilter = (category) => {
            const filteredEntries = markerEntries.filter((entry) =>
                category === '"'"'all'"'"' || entry.category === category);

            markerEntries.forEach((entry) => {
                if (filteredEntries.includes(entry)) {
                    entry.marker.addTo(map);
                } else {
                    map.removeLayer(entry.marker);
                }
            });

            if (filteredEntries.length > 0) {
                map.fitBounds(filteredEntries.map((entry) => entry.position), {
                    padding: [40, 40],
                });
            }

            renderCount(filteredEntries.length);

            if (filtersElement) {
                Array.from(filtersElement.querySelectorAll('"'"'button'"'"')).forEach((button) => {
                    setActiveFilterStyles(button, button.dataset.category === category);
                });
            }
        };

        if (filtersElement) {
            filtersElement.innerHTML = '"'"''"'"';

            const createFilterButton = (label, category, color, active = false) => {
                const button = document.createElement('"'"'button'"'"');
                button.type = '"'"'button'"'"';
                button.dataset.category = category;
                button.innerHTML = `<span class="h-2 w-2 rounded-full" style="background:${color}"></span><span>${escapeHtml(label)}</span>`;
                setActiveFilterStyles(button, active);
                button.addEventListener('"'"'click'"'"', () => applyFilter(category));
                filtersElement.appendChild(button);
            };

            createFilterButton('"'"'Todos'"'"', '"'"'all'"'"', '"'"'#f2cf91'"'"', true);

            categories.forEach((category) => {
                createFilterButton(category, category, colorByCategory(category));
            });
        }

        if (bounds.length > 0) {
            map.fitBounds(bounds, {
                padding: [40, 40],
            });
        }

        renderCount(validItems.length);
    } catch (error) {
        if (countElement) {
            countElement.textContent = '"'"'Sin datos'"'"';
        }

        if (loadingElement) {
            loadingElement.textContent = '"'"'No fue posible cargar el mapa por ahora.'"'"';
        }

        return;
    }

    if (loadingElement) {
        loadingElement.remove();
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 120);
});

