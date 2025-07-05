import React from 'react';

interface ComponentCardProps {
  component: {
    id: string;
    name: string;
    brand: string;
    price: number;
    [key: string]: any;
  };
  category: string;
  onSelect?: (component: any) => void;
}

const ComponentCard: React.FC<ComponentCardProps> = ({ component, category, onSelect }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(component);
    }
  };

  const renderSpecificSpecs = () => {
    switch (category) {
      case 'graphics_cards':
        return (
          <>
            <div className="spec-item">
              <span className="spec-label">Memory:</span>
              <span className="spec-value">{component.memory}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Performance:</span>
              <span className="spec-value">{component.performance_score}/100</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Power:</span>
              <span className="spec-value">{component.power_consumption}W</span>
            </div>
          </>
        );
      case 'processors':
        return (
          <>
            <div className="spec-item">
              <span className="spec-label">Cores/Threads:</span>
              <span className="spec-value">{component.cores}/{component.threads}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Base Clock:</span>
              <span className="spec-value">{component.base_clock}GHz</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Boost Clock:</span>
              <span className="spec-value">{component.boost_clock}GHz</span>
            </div>
          </>
        );
      case 'motherboards':
        return (
          <>
            <div className="spec-item">
              <span className="spec-label">Socket:</span>
              <span className="spec-value">{component.socket}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Chipset:</span>
              <span className="spec-value">{component.chipset}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Form Factor:</span>
              <span className="spec-value">{component.form_factor}</span>
            </div>
          </>
        );
      case 'memory':
        return (
          <>
            <div className="spec-item">
              <span className="spec-label">Capacity:</span>
              <span className="spec-value">{component.capacity}GB</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Speed:</span>
              <span className="spec-value">DDR{component.type.slice(-1)}-{component.speed}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Modules:</span>
              <span className="spec-value">{component.modules}x{component.module_size}GB</span>
            </div>
          </>
        );
      case 'storage':
        return (
          <>
            <div className="spec-item">
              <span className="spec-label">Capacity:</span>
              <span className="spec-value">{component.capacity}GB</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Type:</span>
              <span className="spec-value">{component.type}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Interface:</span>
              <span className="spec-value">{component.interface}</span>
            </div>
          </>
        );
      case 'power_supplies':
        return (
          <>
            <div className="spec-item">
              <span className="spec-label">Wattage:</span>
              <span className="spec-value">{component.wattage}W</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Efficiency:</span>
              <span className="spec-value">{component.efficiency}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Modular:</span>
              <span className="spec-value">{component.modular}</span>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="component-card" onClick={handleClick}>
      <div className="card-header">
        <div className="brand-badge">{component.brand}</div>
        <div className="price">${component.price.toFixed(2)}</div>
      </div>
      
      <div className="card-content">
        <h3 className="component-name">{component.name}</h3>
        
        <div className="specifications">
          {renderSpecificSpecs()}
        </div>

        {component.features && (
          <div className="features">
            <h4>Features:</h4>
            <div className="feature-tags">
              {component.features.slice(0, 3).map((feature: string, index: number) => (
                <span key={index} className="feature-tag">{feature}</span>
              ))}
              {component.features.length > 3 && (
                <span className="feature-tag more">+{component.features.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .component-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(230, 230, 230, 0.6);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          overflow: hidden;
        }

        .component-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .brand-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .price {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .card-content {
          padding: 1.25rem;
        }

        .component-name {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #4a5568;
          line-height: 1.3;
        }

        .specifications {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .spec-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(230, 230, 230, 0.6);
        }

        .spec-item:last-child {
          border-bottom: none;
        }

        .spec-label {
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
        }

        .spec-value {
          font-size: 0.85rem;
          color: #4a5568;
          font-weight: 600;
        }

        .features {
          margin-top: 1rem;
        }

        .features h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: #4a5568;
          font-weight: 600;
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .feature-tag {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .feature-tag.more {
          background: linear-gradient(135deg, #a8b5ff 0%, #c3a6ff 100%);
        }

        @media (max-width: 768px) {
          .component-card {
            margin: 0.5rem;
          }
          
          .card-content {
            padding: 1rem;
          }
          
          .component-name {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ComponentCard; 