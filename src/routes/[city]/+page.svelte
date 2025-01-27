<script>
  import { onMount } from "svelte";
  import moment from "moment";
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
      moment(item.observation_timestamp, "YYYY-MM-DD HH:mm:ss"),
    );
    temperatures = data.data.map((item) => item.temperature);
  }

  const changeTimescale = (timescale) => {
    window.location.href = `/${city}?timescale=${timescale}`;
  };

  onMount(() => {
    if (chartContainer) {
      new Chart(chartContainer, {
        type: "line",
        data: {
          labels: timestamps,
          datasets: [
            {
              label: "Temperature (°C)",
              data: temperatures,
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              fill: { value: -100 },
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: "time",
              time: {
                unit: "auto",
                tooltipFormat: "ll HH:mm",
                displayFormats: {
                  hour: 'HH:mm',
                  day: 'MMM D',
                  week: 'MMM D',
                  month: 'MMM YYYY'
                }
              },
              title: {
                display: true,
                text: "Time of Observation",
              },
              ticks: {
                maxTicksLimit: 8,
                maxRotation: 0,
                autoSkip: true
              }
            },
            y: {
              type: "linear",
              title: {
                display: true,
                text: "Temperature (°C)",
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

  <div class="mb-6 flex justify-center gap-2">
    <button
      class="btn btn-primary btn-sm"
      on:click={() => changeTimescale("hourly")}>Hourly</button
    >
    <button
      class="btn btn-primary btn-sm"
      on:click={() => changeTimescale("daily")}>Daily</button
    >
    <button
      class="btn btn-primary btn-sm"
      on:click={() => changeTimescale("weekly")}>Weekly</button
    >
    <button
      class="btn btn-primary btn-sm"
      on:click={() => changeTimescale("monthly")}>Monthly</button
    >
    <button
      class="btn btn-primary btn-sm"
      on:click={() => changeTimescale("yearly")}>Yearly</button
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
