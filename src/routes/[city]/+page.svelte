<script>
  import { onMount, onDestroy } from "svelte";
  import moment from "moment";
  import { temperatureUnit } from "$lib/stores";

  let stations = [];
  let currentPage = 1;
  let itemsPerPage = 10;
  const itemsPerPageOptions = [10, 25, 50, 100];

  $: {
    if (Array.isArray(data.data.stations)) {
      stations = data.data.stations;
    }
  }

  $: paginatedStations = stations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  function formatTimestamp(timestamp) {
    return moment(timestamp).format("MMM D, YYYY HH:mm");
  }

  function formatTemperature(temp, unit) {
    if (temp == null || isNaN(temp)) return "N/A";
    const numTemp = Number(temp);
    return unit === "C"
      ? numTemp.toFixed(1)
      : ((numTemp * 9) / 5 + 32).toFixed(1);
  }

  $: chartData = {
    labels: timestamps,
    datasets: [
      {
        label: `Temperature (°${$temperatureUnit})`,
        data: temperatures.map((temp) =>
          $temperatureUnit === "C"
            ? temp
            : parseFloat(((temp * 9) / 5 + 32).toFixed(1)),
        ),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: { value: -100 },
        tension: 0.1,
      },
    ],
  };
  import {
    Chart,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    LineController,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
  } from "chart.js";
  import "chartjs-adapter-moment";
  import { page } from "$app/stores";

  Chart.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    LineController,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Filler,
  );

  export let data;
  let city = $page.params.city;
  let timescale = $page.url.searchParams.get("timescale") || "daily";
  const pageTitle = `${city} Weather Statistics | Real-time Temperature Data`;
  const metaDescription = `Current weather conditions and temperature statistics for ${city}. View real-time weather data, temperature changes, and station information.`;
  let chartContainer;

  let timestamps = [];
  let temperatures = [];

  if (Array.isArray(data.data.timeseries)) {
    timestamps = data.data.timeseries.map((item) =>
      moment.parseZone(item.observation_timestamp).local(),
    );
    temperatures = data.data.timeseries.map((item) => item.temperature);
  }

  const changeTimescale = (timescale) => {
    window.location.href = `/${city}?timescale=${timescale}`;
  };

  let chart;

  $: {
    if (chart) {
      chart.destroy();
    }
    if (chartContainer) {
      chart = new Chart(chartContainer, {
        type: "line",
        data: chartData,
        options: {
          responsive: true,
          scales: {
            x: {
              type: "time",
              adapters: {
                date: {
                  zone: "local",
                },
              },
              time: {
                unit: (() => {
                  const timescale =
                    new URLSearchParams(window.location.search).get(
                      "timescale",
                    ) || "daily";
                  switch (timescale) {
                    case "hourly":
                      return "hour";
                    case "daily":
                      return "day";
                    case "weekly":
                      return "week";
                    case "monthly":
                      return "month";
                    default:
                      return "day";
                  }
                })(),
                tooltipFormat: navigator.language.startsWith("en-US")
                  ? "ll hh:mm A"
                  : "ll HH:mm",
                displayFormats: {
                  hour: navigator.language.startsWith("en-US")
                    ? "hh:mm A"
                    : "HH:mm",
                  day: "MMM D",
                  week: "MMM D",
                  month: "MMM YYYY",
                },
                stepSize: 1,
              },
              title: {
                display: true,
                text: "Time of Observation",
              },
              ticks: {
                source: "auto",
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: (() => {
                  const timescale =
                    new URLSearchParams(window.location.search).get(
                      "timescale",
                    ) || "daily";
                  switch (timescale) {
                    case "hourly":
                      return 24; // One label every hour for 24h
                    case "daily":
                      return 28; // One label every 6 hours for 7 days
                    case "weekly":
                      return 28; // One label 3 days for 3 months
                    case "monthly":
                      return 24; // One label per month for a year
                    default:
                      return 12;
                  }
                })(),
              },
            },
            y: {
              type: "linear",
              title: {
                display: true,
                text: `Temperature (°${$temperatureUnit})`, // Updated y-axis label
              },
              ticks: {
                beginAtZero: false,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
            },
            tooltip: {
              intersect: false,
              mode: "nearest",
            },
          },
          hover: {
            intersect: false,
            mode: "nearest",
          },
        },
      });
    }
  }

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={metaDescription} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={metaDescription} />
  <link
    href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css"
    rel="stylesheet"
    type="text/css"
  />
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google tag (gtag.js) -->
  <script
    async
    src="https://www.googletagmanager.com/gtag/js?id=G-Q5W2P7PCEM"
  ></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag("js", new Date());

    gtag("config", "G-Q5W2P7PCEM");
  </script>
</svelte:head>
<main class="max-w-4xl mx-auto p-6 pt-20">
  <div class="bg-base-100/80 shadow-2xl rounded-lg p-6">
    <h1 class="text-3xl font-semibold text-center mb-6">
      Weather Data for {city}
    </h1>

    <div class="mb-6 flex justify-center gap-2">
      <button
        class="btn btn-primary btn-sm"
        on:click={() => changeTimescale("hourly")}>One Day</button
      >
      <button
        class="btn btn-primary btn-sm"
        on:click={() => changeTimescale("daily")}>One Week</button
      >
      <button
        class="btn btn-primary btn-sm"
        on:click={() => changeTimescale("weekly")}>One Month</button
      >
      <!-- <button
      class="btn btn-primary btn-sm"
      on:click={() => changeTimescale("monthly")}>One Year</button
    > -->
      <!-- <button
      class="btn btn-primary btn-sm"
      on:click={() => changeTimescale("yearly")}>Ten Years</button
    > -->
    </div>

    <div class="mb-6">
      <canvas bind:this={chartContainer}></canvas>
    </div>

    <div class="overflow-x-auto">
      <div class="flex grid grid-cols-2 gap-4 items-center mb-4">
        <select
          class="select select-bordered w-full max-w-xs"
          bind:value={itemsPerPage}
        >
          {#each itemsPerPageOptions as option}
            <option value={option}>{option} per page</option>
          {/each}
        </select>
        <button
          class="btn btn-sm btn-outline"
          on:click={async () => {
            const response = await fetch(
              `/api/weather-cities/${city}?timescale=${timescale}`,
            );
            const data = await response.json();
            const stations = data.stations;

            const headers = [
              "Station ID",
              "Station Name",
              "Latitude",
              "Longitude",
              "Temperature",
              "Humidity",
              "Wind Speed",
              "Pressure",
              "Quality Score",
              "Last Update",
            ];
            const csvContent = [
              headers.join(","),
              ...stations.map((station) =>
                [
                  station.station_id,
                  `"${station.station_name || ""}"`,
                  station.latitude,
                  station.longitude,
                  station.temperature,
                  station.humidity,
                  station.wind_speed,
                  station.pressure,
                  station.data_quality_score,
                  station.observation_timestamp,
                ].join(","),
              ),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${city}_stations.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
        >
          Download Stations Data
        </button>
      </div>
      <table class="table table-zebra w-full hover:table-zebra bg-transparent">
        <thead>
          <tr>
            <th class="text-primary">Station Name</th>
            <th class="text-primary">Temperature</th>
            <th class="text-primary">Humidity</th>
            <th class="text-primary">Wind Speed</th>
            <th class="text-primary">Pressure</th>
            <th class="text-primary">Quality Score</th>
            <th class="text-primary">Last Update</th>
          </tr>
        </thead>
        <tbody>
          {#each paginatedStations as station}
            <tr
              class="hover:bg-base-300 transition-colors duration-200 cursor-pointer"
            >
              <td class="font-semibold">
                <a
                  href="https://explorer.weatherxm.com/stations/{station.station_name
                    .toLowerCase()
                    .replace(/\s+/g, '-')}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary hover:text-primary-focus"
                >
                  {station.station_name || station.station_id}
                </a>
              </td>
              <td
                >{formatTemperature(
                  station.temperature,
                  $temperatureUnit,
                )}°{$temperatureUnit}</td
              >
              <td>{station.humidity?.toFixed(1)}%</td>
              <td>{station.wind_speed?.toFixed(1)} m/s</td>
              <td>{station.pressure?.toFixed(1)} hPa</td>
              <td>
                <div
                  class="radial-progress text-primary"
                  style="--value:{(station.data_quality_score * 100).toFixed(
                    0,
                  )};"
                >
                  {(station.data_quality_score * 100).toFixed(0)}%
                </div>
              </td>
              <td>{formatTimestamp(station.observation_timestamp)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center gap-4">
          <div class="text-sm text-base-content/70">
            Showing {Math.min(
              (currentPage - 1) * itemsPerPage + 1,
              stations.length,
            )} to {Math.min(currentPage * itemsPerPage, stations.length)} of {stations.length}
            stations
          </div>
        </div>
        <div class="join">
          <button
            class="join-item btn"
            disabled={currentPage === 1}
            on:click={() => (currentPage = 1)}>«</button
          >
          <button
            class="join-item btn"
            disabled={currentPage === 1}
            on:click={() => currentPage--}>‹</button
          >
          <button class="join-item btn">Page {currentPage}</button>
          <button
            class="join-item btn"
            disabled={currentPage >= Math.ceil(stations.length / itemsPerPage)}
            on:click={() => currentPage++}>›</button
          >
          <button
            class="join-item btn"
            disabled={currentPage >= Math.ceil(stations.length / itemsPerPage)}
            on:click={() =>
              (currentPage = Math.ceil(stations.length / itemsPerPage))}
            >»</button
          >
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  canvas {
    width: 100%;
    height: 400px;
  }
</style>
