import { useNavigate } from "react-router-dom";

const farmers = [
  {
    id: "F102",
    name: "Raj Farm",
    crop: "Tomato",
    quantity: "420 kg",
    location: "Nashik",
    status: "Ready",
  },
  {
    id: "F118",
    name: "Green Valley",
    crop: "Mango",
    quantity: "180 kg",
    location: "Pune",
    status: "Pending",
  },
  {
    id: "F121",
    name: "Fresh Fields",
    crop: "Capsicum",
    quantity: "260 kg",
    location: "Nashik",
    status: "Ready",
  },
  {
    id: "F130",
    name: "Punjab Organics",
    crop: "Potato",
    quantity: "510 kg",
    location: "Punjab",
    status: "Scheduled",
  },
];

export default function AggregatorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="role-page">

      <div className="role-header">
        <div>
          <span className="role-badge">🚚 Aggregator</span>

          <h1>Good morning, Aggregator 👋</h1>

          <p>
            Coordinate farmers, collections, routes and produce batches.
          </p>
        </div>

        <button onClick={() => navigate("/batches")}>
          View Batches
        </button>
      </div>


      <div className="kpi-grid">

        <KPI value="24" label="Active Farmers" />

        <KPI value="2.4 T" label="Collected Today" />

        <KPI value="18" label="Active Batches" />

        <KPI value="94%" label="Average Quality" />

      </div>


      <div className="two-column">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Farmer Network</h2>

              <p>
                Farmers requiring collection today
              </p>
            </div>

            <button>
              + Add Farmer
            </button>

          </div>


          <table>

            <thead>

              <tr>
                <th>Farmer</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {farmers.map((farmer) => (

                <tr key={farmer.id}>

                  <td>
                    <strong>{farmer.name}</strong>
                    <br />
                    <small>{farmer.id}</small>
                  </td>

                  <td>{farmer.crop}</td>

                  <td>{farmer.quantity}</td>

                  <td>{farmer.location}</td>

                  <td>
                    <span className="status">
                      {farmer.status}
                    </span>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        <div className="panel ai-panel">

          <span className="ai-icon">✦</span>

          <h2>AI Route Advisor</h2>

          <p>
            Farmers F102 and F121 are located on the
            same route. Combining their pickups can
            reduce transportation cost by approximately
            16%.
          </p>

          <button>
            Optimize Route →
          </button>

        </div>

      </div>


      <div className="panel">

        <h2>Collection Actions</h2>

        <div className="action-grid">

          <Action text="Add Farmer" />

          <Action text="Schedule Pickup" />

          <Action text="Create Collection" />

          <Action text="Combine Batches" />

        </div>

      </div>


      <div className="two-column">

        <div className="panel">

          <h2>Collection Trend</h2>

          <div className="chart">

            {[45, 60, 72, 55, 85, 92, 78].map(
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

          <Activity text="Pickup scheduled for Farmer F102" />

          <Activity text="New batch collected from F121" />

          <Activity text="Route optimization completed" />

          <Activity text="Farmer F118 added to network" />

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