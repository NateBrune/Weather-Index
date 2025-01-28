
<script>
  import moment from "moment";
  import { temperatureUnit } from '$lib/stores';

  $: chartData = {
    labels: data.data.map(d => moment.parseZone(d.observation_timestamp).local()),
    datasets: [{
      label: `Temperature (°${$temperatureUnit})`,
      data: data.data.map(d => $temperatureUnit === 'C' ? d.temperature : (d.temperature * 9/5) + 32),
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
  let state = $page.params.state;
  let chartContainer;

  const changeTimescale = (timescale) => {
    window.location.href = `/state/${state}?timescale=${timescale}`;
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
                      return 24;
                    case "daily":
                      return 28;
                    case "weekly":
                      return 28;
                    case "monthly":
                      return 24;
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
                text: `Temperature (°${$temperatureUnit})`,
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
</script>

<svelte:head>
  <title>State Weather Statistics</title>
  <meta name="description" content="Weather statistics by state" />
  <link
    href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css"
    rel="stylesheet"
    type="text/css"
  />
  <script src="https://cdn.tailwindcss.com"></script>
</svelte:head>

<main class="max-w-4xl mx-auto p-6 pt-20">
  <div class="bg-base-200 shadow-lg rounded-lg p-6">
  <h1 class="text-3xl font-semibold text-center mb-6">
    Weather Data for {state}
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
