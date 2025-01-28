<script>
  import { onMount, onDestroy } from "svelte";
  import moment from "moment";
  import { temperatureUnit } from '$lib/stores';

  $: chartData = {
    labels: timestamps,
    datasets: [{
      label: `Temperature (°${$temperatureUnit})`,
      data: temperatures.map(temp => $temperatureUnit === 'C' ? temp : parseFloat((temp * 9/5 + 32).toFixed(1))),
      borderColor: "rgb(255, 99, 132)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      fill: { value: -100 },
      tension: 0.1,
    }]
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
  let chartContainer;

  let timestamps = [];
  let temperatures = [];

  if (Array.isArray(data.data)) {
    timestamps = data.data.map((item) =>
      moment.parseZone(item.observation_timestamp).local(),
    );
    temperatures = data.data.map((item) => item.temperature);
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
      Chart.defaults.color = '#666';
      Chart.defaults.borderColor = 'rgba(163, 163, 163, 0.2)';
      Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';
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
                  zone: 'local'
                }
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
                tooltipFormat: navigator.language.startsWith('en-US') ? "ll hh:mm A" : "ll HH:mm",
                displayFormats: {
                  hour: navigator.language.startsWith('en-US') ? "hh:mm A" : "HH:mm",
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
  <title>City Weather Statistics</title>
  <meta name="description" content="Weather statistics by city" />
  <link
    href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css"
    rel="stylesheet"
    type="text/css"
  />
  <script src="https://cdn.tailwindcss.com"></script>
</svelte:head>
<main class="max-w-4xl mx-auto p-6 bg-base-200 rounded-lg shadow-lg">
  <h1 class="text-3xl font-semibold text-center mb-6">
    Weather Data for {city}
  </h1>

  <div class="mb-6 flex justify-center gap-3">
    <button
      class="btn btn-sm glass hover:shadow-lg transition-all"
      on:click={() => changeTimescale("hourly")}>One Day</button
    >
    <button
      class="btn btn-sm glass hover:shadow-lg transition-all"
      on:click={() => changeTimescale("daily")}>One Week</button
    >
    <button
      class="btn btn-sm glass hover:shadow-lg transition-all"
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
</main>

<style>
  canvas {
    width: 100%;
    height: 400px;
  }
</style>