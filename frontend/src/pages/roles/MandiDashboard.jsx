const marketData = [
  {
    product: "Tomato",
    arrival: "2.1 T",
    demand: "High",
    price: "₹32/kg",
  },
  {
    product: "Mango",
    arrival: "1.4 T",
    demand: "Medium",
    price: "₹68/kg",
  },
  {
    product: "Potato",
    arrival: "2.8 T",
    demand: "Stable",
    price: "₹24/kg",
  },
  {
    product: "Capsicum",
    arrival: "0.9 T",
    demand: "High",
    price: "₹54/kg",
  },
];

export default function MandiDashboard() {
  return (
    <div className="role-page">

      <div className="role-header">

        <div>

          <span className="role-badge">
            🏪 Mandi
          </span>

          <h1>Market Overview 👋</h1>

          <p>
            Track market arrivals, prices, buyers
            and produce demand.
          </p>

        </div>

      </div>


      <div className="kpi-grid">

        <KPI value="42" label="Today's Arrivals" />

        <KPI value="8.6 T" label="Market Volume" />

        <KPI value="31" label="Active Buyers" />

        <KPI value="14" label="Pending Dispatches" />

      </div>


      <div className="two-column">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Market Activity</h2>
              <p>Today's market conditions</p>
            </div>

            <button>
              + Register Arrival
            </button>

          </div>


          <table>

            <thead>

              <tr>
                <th>Product</th>
                <th>Arrival</th>
                <th>Demand</th>
                <th>Price</th>
              </tr>

            </thead>

            <tbody>

              {marketData.map((item) => (

                <tr key={item.product}>

                  <td>
                    <strong>
                      {item.product}
                    </strong>
                  </td>

                  <td>{item.arrival}</td>

                  <td>
                    <span className="status">
                      {item.demand}
                    </span>
                  </td>

                  <td>{item.price}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        <div className="panel ai-panel">

          <span className="ai-icon">
            ✦
          </span>

          <h2>AI Market Insight</h2>

          <p>
            Tomato demand is currently 22% above
            today's arrivals. Prioritize tomato
            batches for buyer matching.
          </p>

          <button>
            Match Buyers →
          </button>

        </div>

      </div>


      <div className="panel">

        <h2>Market Actions</h2>

        <div className="action-grid">

          <Action text="Register Arrival" />

          <Action text="View Demand" />

          <Action text="Match Buyer" />

          <Action text="Create Listing" />

        </div>

      </div>


      <div className="two-column">

        <div className="panel">

          <h2>Price Trend</h2>

          <div className="chart">

            {[50, 65, 55, 72, 68, 85, 92].map(
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

          <h2>Buyer Activity</h2>

          <Activity text="Delhi Fresh Stores requested 420 kg tomato" />

          <Activity text="GreenMart requested 180 kg mango" />

          <Activity text="FreshKart listed new purchase order" />

          <Activity text="Buyer matching completed" />

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