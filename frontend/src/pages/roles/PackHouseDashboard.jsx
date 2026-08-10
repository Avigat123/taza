import { useNavigate } from "react-router-dom";

const batches = [
  {
    id: "MNG-118",
    product: "Mango",
    quantity: "420 kg",
    stage: "Sorting",
    grade: "A",
  },
  {
    id: "TOM-204",
    product: "Tomato",
    quantity: "680 kg",
    stage: "Grading",
    grade: "A",
  },
  {
    id: "CAP-091",
    product: "Capsicum",
    quantity: "260 kg",
    stage: "Packing",
    grade: "B",
  },
  {
    id: "POT-332",
    product: "Potato",
    quantity: "510 kg",
    stage: "Ready",
    grade: "A",
  },
];

export default function PackHouseDashboard() {
  const navigate = useNavigate();

  return (
    <div className="role-page">

      <div className="role-header">

        <div>

          <span className="role-badge">
            📦 Pack House
          </span>

          <h1>Pack House Operations 👋</h1>

          <p>
            Sort, grade, pack and prepare fresh produce
            for dispatch.
          </p>

        </div>

        <button onClick={() => navigate("/inspect")}>
          Inspect Batch
        </button>

      </div>


      <div className="kpi-grid">

        <KPI value="18" label="Incoming Batches" />

        <KPI value="2.8 T" label="To Be Processed" />

        <KPI value="96%" label="Grade A Produce" />

        <KPI value="12" label="Ready to Dispatch" />

      </div>


      <div className="two-column">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Processing Queue</h2>

              <p>
                Current production pipeline
              </p>
            </div>

            <button>
              + Create Batch
            </button>

          </div>


          <table>

            <thead>

              <tr>
                <th>Batch</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Stage</th>
                <th>Grade</th>
              </tr>

            </thead>

            <tbody>

              {batches.map((batch) => (

                <tr key={batch.id}>

                  <td>
                    <strong>{batch.id}</strong>
                  </td>

                  <td>{batch.product}</td>

                  <td>{batch.quantity}</td>

                  <td>
                    <span className="status">
                      {batch.stage}
                    </span>
                  </td>

                  <td>{batch.grade}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        <div className="panel ai-panel">

          <span className="ai-icon">
            ✦
          </span>

          <h2>AI Processing Advisor</h2>

          <p>
            Batch MNG-118 has the shortest remaining
            shelf life. Process it before the other
            incoming batches to reduce spoilage risk.
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


      <div className="panel">

        <h2>Pack House Actions</h2>

        <div className="action-grid">

          <Action text="Inspect Batch" />

          <Action text="Grade Produce" />

          <Action text="Create Package" />

          <Action text="Generate Label" />

        </div>

      </div>


      <div className="two-column">

        <div className="panel">

          <h2>Processing Progress</h2>

          <Progress
            label="Sorting"
            value="82%"
          />

          <Progress
            label="Grading"
            value="68%"
          />

          <Progress
            label="Packing"
            value="54%"
          />

          <Progress
            label="Dispatch"
            value="38%"
          />

        </div>


        <div className="panel">

          <h2>Recent Activity</h2>

          <Activity text="MNG-118 entered sorting" />

          <Activity text="TOM-204 graded as Grade A" />

          <Activity text="CAP-091 entered packing" />

          <Activity text="POT-332 marked ready for dispatch" />

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


function Progress({ label, value }) {
  return (
    <div style={{ marginBottom: "18px" }}>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "7px",
        }}
      >
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div
        style={{
          height: "8px",
          background: "#e8eee9",
          borderRadius: "10px",
        }}
      >

        <div
          style={{
            width: value,
            height: "100%",
            background: "#176b3a",
            borderRadius: "10px",
          }}
        />

      </div>

    </div>
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