const shipments = [
  {
    id: "CC-204",
    route: "Delhi → Pune",
    temperature: "4.2°C",
    status: "On Route",
  },
  {
    id: "CC-211",
    route: "Shimla → Delhi",
    temperature: "3.8°C",
    status: "On Route",
  },
  {
    id: "CC-218",
    route: "Nashik → Mumbai",
    temperature: "6.1°C",
    status: "Attention",
  },
  {
    id: "CC-221",
    route: "Punjab → Delhi",
    temperature: "4.0°C",
    status: "On Route",
  },
];

export default function ColdChainDashboard() {
  return (
    <div className="role-page">

      <div className="role-header">

        <div>

          <span className="role-badge">
            ❄️ Cold Chain
          </span>

          <h1>Cold Chain Control Center 👋</h1>

          <p>
            Monitor temperature, sensors, shipments
            and cold-chain alerts.
          </p>

        </div>

      </div>


      <div className="kpi-grid">

        <KPI value="12" label="Active Shipments" />

        <KPI value="4°C" label="Average Temperature" />

        <KPI value="98.2%" label="Sensor Uptime" />

        <KPI value="02" label="Active Alerts" />

      </div>


      <div className="two-column">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Live Shipments</h2>
              <p>Current cold-chain movement</p>
            </div>

            <button>
              Track Shipment
            </button>

          </div>


          <table>

            <thead>

              <tr>
                <th>Shipment</th>
                <th>Route</th>
                <th>Temperature</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {shipments.map((shipment) => (

                <tr key={shipment.id}>

                  <td>
                    <strong>
                      {shipment.id}
                    </strong>
                  </td>

                  <td>{shipment.route}</td>

                  <td>{shipment.temperature}</td>

                  <td>
                    <span className="status">
                      {shipment.status}
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

          <h2>AI Cold Chain Alert</h2>

          <p>
            Shipment CC-218 is above its preferred
            temperature range. Inspect the cooling
            unit at the next checkpoint.
          </p>

          <button>
            Open Alert →
          </button>

        </div>

      </div>


      <div className="panel">

        <h2>Cold Chain Actions</h2>

        <div className="action-grid">

          <Action text="Track Shipment" />

          <Action text="View Sensors" />

          <Action text="Open Alerts" />

          <Action text="Inspect Vehicle" />

        </div>

      </div>


      <div className="two-column">

        <div className="panel">

          <h2>Temperature Trend</h2>

          <div className="chart">

            {[42, 48, 45, 51, 46, 58, 52].map(
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

          <h2>Alerts</h2>

          <Activity text="CC-218 temperature exceeded threshold" />

          <Activity text="Sensor battery low on CC-211" />

          <Activity text="CC-204 checkpoint completed" />

          <Activity text="CC-221 entered delivery zone" />

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