import { useNavigate } from "react-router-dom";

const inventory = [
  {
    product: "Tomato",
    stock: "320 kg",
    demand: "140 kg",
    status: "Reorder",
  },
  {
    product: "Mango",
    stock: "180 kg",
    demand: "90 kg",
    status: "Monitor",
  },
  {
    product: "Potato",
    stock: "510 kg",
    demand: "120 kg",
    status: "Healthy",
  },
  {
    product: "Capsicum",
    stock: "120 kg",
    demand: "100 kg",
    status: "Urgent",
  },
];

export default function RetailerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="role-page">

      <div className="role-header">

        <div>

          <span className="role-badge">
            🛒 Retailer
          </span>

          <h1>Store Operations Overview 👋</h1>

          <p>
            Manage store inventory, demand,
            replenishment and fresh produce waste.
          </p>

        </div>

        <button
          onClick={() =>
            navigate("/recommendations")
          }
        >
          AI Recommendations
        </button>

      </div>


      <div className="kpi-grid">

        <KPI value="1.84 T" label="Store Inventory" />

        <KPI value="460 kg" label="Today's Demand" />

        <KPI value="120 kg" label="At-Risk Stock" />

        <KPI value="18" label="Reorder Alerts" />

      </div>


      <div className="two-column">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Store Inventory</h2>
              <p>Current stock position</p>
            </div>

            <button>
              + Create Order
            </button>

          </div>


          <table>

            <thead>

              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Demand</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {inventory.map((item) => (

                <tr key={item.product}>

                  <td>
                    <strong>
                      {item.product}
                    </strong>
                  </td>

                  <td>{item.stock}</td>

                  <td>{item.demand}</td>

                  <td>
                    <span className="status">
                      {item.status}
                    </span>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        <div className="panel ai-panel">

          <span className="ai-icon">
            ✦
          </span>

          <h2>AI Reorder Advisor</h2>

          <p>
            Tomato demand is expected to increase
            by 28% over the next 3 days.
            Taza recommends ordering 180 kg.
          </p>

          <button>
            Create Recommended Order →
          </button>

        </div>

      </div>


      <div className="panel">

        <h2>Retail Actions</h2>

        <div className="action-grid">

          <Action text="Create Order" />

          <Action text="Transfer Stock" />

          <Action text="View Forecast" />

          <Action text="Mark Clearance" />

        </div>

      </div>


      <div className="two-column">

        <div className="panel">

          <h2>Demand Forecast</h2>

          <div className="chart">

            {[40, 55, 60, 68, 72, 86, 95].map(
              (height, index) => (

                <div
                  key={index}
                  style={{
                    height: `${height}%`,
                  }}
                />

              )
            )}

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

          <Activity text="Tomato reorder alert generated" />

          <Activity text="Mango stock transferred to Store #18" />

          <Activity text="Demand forecast updated" />

          <Activity text="Capsicum marked as at-risk" />

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