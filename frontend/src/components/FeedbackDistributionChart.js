import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

/**
 * Feedback Distribution Chart - Shows distribution of ratings
 */
const FeedbackDistributionChart = ({ metrics = {} }) => {
  const chartRef = useRef(null);
  const { feedbackByRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } = metrics;

  useEffect(() => {
    if (!chartRef.current) return;

    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }

    const ratings = [5, 4, 3, 2, 1];
    const counts = ratings.map(r => feedbackByRating[r] || 0);
    const total = counts.reduce((a, b) => a + b, 0);

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const param = params[0];
          const count = param.value;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return `<strong>${param.name} Stars</strong><br/>Count: ${count}<br/>Percentage: ${percentage}%`;
        }
      },
      xAxis: {
        type: "category",
        data: ["5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"],
        axisLabel: { fontSize: 11 }
      },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: "Count",
          data: counts,
          type: "bar",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#3B82F6" },
              { offset: 1, color: "#1E40AF" }
            ])
          },
          label: {
            show: true,
            position: "top",
            fontSize: 11,
            fontWeight: "bold"
          }
        }
      ],
      grid: { left: "10%", right: "10%", top: "15%", bottom: "10%", containLabel: true }
    };

    chart.setOption(option);

    const handleResize = () => chart?.resize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [feedbackByRating]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
        Rating Distribution
      </h3>
      <div ref={chartRef} style={{ width: "100%", height: "300px" }}></div>
    </div>
  );
};

export default FeedbackDistributionChart;
