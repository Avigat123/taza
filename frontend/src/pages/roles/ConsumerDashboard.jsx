import { useNavigate } from "react-router-dom";

export default function ConsumerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="role-page">

      <div className="role-header">

        <div>

          <span className="role-badge">
            👤 Consumer
          </span>

          <h1>Welcome to Taza 👋</h1>

          <p>
            Know where your food came from,
            how fresh it is and how it reached you.
          </p>

        </div>

        <button>
          📷 Scan Product
        </button>

      </div>


      <div className="two-column">

        <div className="panel">

          <div
            style={{
              fontSize: "70px",
              textAlign: "center",
              padding: "15px",
            }}
          >
            🥭
          </div>

          <h2 style={{ textAlign: "center" }}>
            Alphonso Mango
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#657269",
            }}
          >
            Premium fresh produce
          </p>

          <div
            style={{
              textAlign: "center",
              marginTop: "25px",
            }}
          >

            <strong
              style={{
                fontSize: "48px",
                color: "#176b3a",
              }}
            >
              92%
            </strong>

            <p>
              Freshness Score
            </p>

          </div>

        </div>


        <div className="panel">

          <h2>Product Information</h2>

          <Info
            label="Origin"
            value="Nashik, Maharashtra"
          />

          <Info
            label="Harvested"
            value="06 Aug 2026"
          />

          <Info
            label="Packed"
            value="07 Aug 2026"
          />

          <Info
            label="Estimated Freshness"
            value="4–5 days"
          />

          <Info
            label="Batch"
            value="MNG-118"
          />

        </div>

      </div>


      <div className="panel">

        <h2>Product Journey</h2>

        <p
          style={{
            color: "#657269",
            marginBottom: "25px",
          }}
        >
          Track your product from farm to shelf.
        </p>


        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >

          <Journey
            icon="🌾"
            title="Farm"
            text="Nashik"
          />

          <Arrow />

          <Journey
            icon="🚚"
            title="Aggregator"
            text="Collected"
          />

          <Arrow />

          <Journey
            icon="📦"
            title="Pack House"
            text="Grade A"
          />

          <Arrow />

          <Journey
            icon="🏭"
            title="Warehouse"
            text="Stored"
          />

          <Arrow />

          <Journey
            icon="❄️"
            title="Cold Chain"
            text="4°C"
          />

          <Arrow />

          <Journey
            icon="🛒"
            title="Retailer"
            text="Delhi"
          />

        </div>

      </div>


      <div className="two-column">

        <div className="panel ai-panel">

          <span className="ai-icon">
            ✦
          </span>

          <h2>Freshness Assistant</h2>

          <p>
            This mango currently has a 92% freshness
            score and is estimated to remain in its
            optimal consumption window for another
            4–5 days.
          </p>

          <button>
            Check Freshness →
          </button>

        </div>


        <div className="panel">

          <h2>Consumer Actions</h2>

          <div className="action-grid">

            <Action text="Scan Product" />

            <Action text="View Journey" />

            <Action text="Check Freshness" />

            <Action text="Report Issue" />

          </div>

        </div>

      </div>

    </div>
  );
}


function Info({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "15px 0",
        borderBottom: "1px solid #edf1ee",
      }}
    >

      <span style={{ color: "#657269" }}>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function Journey({ icon, title, text }) {
  return (
    <div
      style={{
        textAlign: "center",
        minWidth: "80px",
      }}
    >

      <div
        style={{
          fontSize: "34px",
          marginBottom: "7px",
        }}
      >
        {icon}
      </div>

      <strong>{title}</strong>

      <div
        style={{
          fontSize: "12px",
          color: "#657269",
          marginTop: "4px",
        }}
      >
        {text}
      </div>

    </div>
  );
}


function Arrow() {
  return (
    <span
      style={{
        fontSize: "24px",
        color: "#176b3a",
      }}
    >
      →
    </span>
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