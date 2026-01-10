import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTasks, faComments, faChartBar } from "@fortawesome/free-solid-svg-icons";

const LoginHero = ({ imageSrc }) => {
  const features = [
    {
      icon: faTasks,
      title: "Streamlined Workflow",
      description: "Track complaints from submission to resolution",
    },
    {
      icon: faComments,
      title: "Real-Time Communication",
      description: "Direct messaging between students and staff",
    },
    {
      icon: faChartBar,
      title: "Comprehensive Analytics",
      description: "Gain insights to improve campus services",
    },
  ];

  return (
    <div className="right-side-container">
      <div className="right-side-container-bg">
        <img src={imageSrc} alt="University Campus" className="unicampusImage" />
        <div className="unicampusBgColor"></div>
      </div>
      <div className="description-container">
        <h2 className="text-2xl font-bold mb-4">Complaint Management System</h2>
        <p className="text-lg mb-6">
          Efficiently manage and resolve student complaints with our comprehensive platform.
        </p>
        <div className="description-container-points">
          {features.map((feature) => (
            <div className="points-animation" key={feature.title}>
              <div className="points-animation-icon">
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <div className="ml-4">
                <h3 className="points-wording">{feature.title}</h3>
                <p className="mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginHero;
