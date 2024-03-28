var dailyWiseReport = document.getElementById("DailyWise").value;

const dataArray = dailyWiseReport.split(",").map(Number);

var dayCategories = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

//bar chart
var options = {
  series: [
    {
      name: "Amount",
      data: dataArray,
    },
  ],

  chart: {
    toolbar: {
      show: false,
    },
  },

  chart: {
    height: 320,
  },

  legend: {
    show: false,
  },

  colors: ["#FF0000"],

  markers: {
    size: 1,
  },

  // grid: {
  //     show: false,
  //     xaxis: {
  //         lines: {
  //             show: false
  //         }
  //     },
  // },

  xaxis: {
    categories: dayCategories,
    formatter: function (value, index) {
      return `${value}`;
    },
  },

  responsive: [
    {
      breakpoint: 1400,
      options: {
        chart: {
          height: 300,
        },
      },
    },

    {
      breakpoint: 992,
      options: {
        chart: {
          height: 210,
          width: "100%",
          offsetX: 0,
        },
      },
    },

    {
      breakpoint: 578,
      options: {
        chart: {
          height: 200,
          width: "105%",
          offsetX: -20,
          offsetY: 10,
        },
      },
    },

    {
      breakpoint: 430,
      options: {
        chart: {
          width: "108%",
        },
      },
    },

    {
      breakpoint: 330,
      options: {
        chart: {
          width: "112%",
        },
      },
    },
  ],
};

var Chart = new ApexCharts(
  document.querySelector("#bar-chart-earning"),
  options
);
Chart.render();

