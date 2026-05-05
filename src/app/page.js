'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, TrendingDown, Store, ExternalLink, Package } from 'lucide-react';

export default function PriceDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchPrices = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Data is not an array:', data);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetch('/api/prices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
        setLoading(false);
      });
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  const getBestPrice = (prices) => {
    const values = Object.values(prices);
    if (values.length === 0) return null;
    return Math.min(...values);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="glass-card">Cargando dashboard...</div>
    </div>
  );

  return (
    <main>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Price Intel</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitoreo en tiempo real de competidores</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={fetchPrices}
          disabled={updating}
        >
          <RefreshCw size={20} className={updating ? 'animate-spin' : ''} />
          {updating ? 'Actualizando...' : 'Refrescar Precios'}
        </button>
      </header>

      <section className="glass-card">
        <table className="price-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Universo</th>
              <th>Rex</th>
              <th>Prestigio</th>
              <th>Pisano</th>
              <th>Ámbito</th>
              <th>Mejor Precio</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const bestPrice = getBestPrice(product.prices);
              return (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{product.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {product.sku}</span>
                    </div>
                  </td>
                  {['tiendauniverso.com.ar', 'somosrex.com', 'prestigio.com.ar', 'pisano.com.ar', 'pintureriasambito.com'].map(store => {
                    const price = product.prices[store];
                    const isBest = price === bestPrice && price !== null;
                    return (
                      <td key={store}>
                        {price ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: isBest ? 'var(--success)' : 'white', fontWeight: isBest ? 700 : 400 }}>
                              {formatCurrency(price)}
                            </span>
                            {isBest && <span className="badge badge-success" style={{ width: 'fit-content', marginTop: '0.25rem' }}>Más barato</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No disponible</span>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    {bestPrice ? (
                      <div className="glass-card" style={{ padding: '0.5rem 1rem', border: '1px solid var(--success)', display: 'inline-block' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(bestPrice)}</span>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </main>
  );
}
