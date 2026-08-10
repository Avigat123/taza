import { useNavigate } from "react-router-dom";

export default function FarmerDashboard() {
  const navigate = useNavigate();

  const crops = [
    {
      name: "Tomato",
      quantity: "420 kg",
      health: "94%",
      harvest: "2 days",
      status: "Ready",
    },
    {
      name: "Mango",
      quantity: "180 kg",
      health: "88%",
      harvest: "4 days",
      status: "Soon",
    },
    {
      name: "Capsicum",
      quantity: "260 kg",
      health: "96%",
      harvest: "7 days",
      status: "Healthy",
    },
    {
      name: "Potato",
      quantity: "510 kg",
      health: "97%",
      harvest: "12 days",
      status: "Healthy",
    },
  ];

  return (
    <div className="role-page">

      <div className="role-header">
        <div>
          <span className="role-badge">🌾 Farmer</span>

          <h1>Good morning, Farmer 👋</h1>

          <p>
            Manage your crops, harvests and farm produce.
          </p>
        </div>
      </div>

      {/* KPIs */}

      <div className="kpi-grid">

        <KPI value="420 kg" label="Ready to Harvest" />

        <KPI value="180 kg" label="Harvesting Soon" />

        <KPI value="92%" label="Average Crop Quality" />

        <KPI value="06" label="Active Batches" />

      </div>


      <div className="two-column">

        {/* CROPS */}

        <div className="panel">

          <div className="panel-header">
            <div>
              <h2>My Crops</h2>
              <p>Current crop status</p>
            </div>

            <button
              onClick={() => navigate("/inspect")}
            >
              Inspect Crop
            </button>
          </div>

          <table>

            <thead>
              <tr>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Health</th>
                <th>Harvest</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {crops.map((crop) => (

                <tr key={crop.name}>

                  <td>
                    <strong>{crop.name}</strong>
                  </td>

                  <td>{crop.quantity}</td>

                  <td>{crop.health}</td>

                  <td>{crop.harvest}</td>

                  <td>
                    <span className="status">
                      {crop.status}
                    </span>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* AI */}

        <div className="panel ai-panel">

          <span className="ai-icon">✦</span>

          <h2>AI Harvest Advisor</h2>

          <p>
            Your mango crop has approximately
            4 days of optimal freshness remaining.
            Consider creating a batch and contacting
            an aggregator today.
          </p>

          <button
            onClick={() =>
              navigate("/recommendations")
            }
          >
            View Recommendation →
          </button>

        </div>

      </div>


      {/* QUICK ACTIONS */}

      <div className="panel">

        <h2>Quick Actions</h2>

        <div className="action-grid">

          <Action text="Add New Crop" />

          <Action text="Create Produce Batch" />

          <Action text="Find Buyer" />

          <Action text="View Market Prices" />

        </div>

      </div>


      {/* HARVEST FORECAST */}

      <div className="two-column">

        <div className="panel">

          <h2>Harvest Forecast</h2>

          <div className="chart">

            <div style={{ height: "45%" }} />
            <div style={{ height: "65%" }} />
            <div style={{ height: "55%" }} />
            <div style={{ height: "80%" }} />
            <div style={{ height: "70%" }} />
            <div style={{ height: "92%" }} />
            <div style={{ height: "82%" }} />

          </div>

          <div className="chart-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

        </div>


        <div className="panel">

          <h2>Recent Activity</h2>

          <Activity text="Mango crop inspection completed" />
          <Activity text="Tomato batch created" />
          <Activity text="Harvest recommendation generated" />
          <Activity text="New aggregator nearby" />

        </div>

      </div>

    </div>
  );
}


function KPI({ value, label }) {
  return (
    <div className="kpi-card">

      <strong>{value}</strong>

      <span>{label}</span>

    </div>
  );
}


function Action({ text }) {
  return (
    <button className="action-card">

      <span>{text}</span>

      <span>→</span>

    </button>
  );
}


function Activity({ text }) {
  return (
    <div className="activity">

      <span>●</span>

      {text}

    </div>
  );
}