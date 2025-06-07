import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteCircuit } from '../redux/actions/circuitActions';
import './circuitCard.css';

const CircuitCard = ({ circuit }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.auth || {});
  const isAdmin = userInfo?.role === 'admin' || false;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${circuit.name}? This action cannot be undone.`)) {
      dispatch(deleteCircuit(circuit.id));
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg mt-4 shadow-md border border-gray-200 relative">
      <div>
        <div className="flex flex-col md:flex-row gap-4" style={{ transform: 'scale(1) translateZ(0px)', opacity: 1 }}>
          <img
            src="https://levoyageur-organise.com/wp-content/uploads/2023/09/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHg5NTI3NDEtaW1hZ2Uta3d2eDhja3IuanBn.jpg"
            alt={circuit.name || 'Circuit Image'}
            className="w-full md:w-32 h-32 object-cover rounded-lg"
          />
          <div className="flex flex-col justify-between w-full relative">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">{circuit.name || 'Circuit Title'}</span>
              {isAdmin && (
                <Button
                  variant="danger"
                  className="ml-4"
                  onClick={handleDelete}
                >
                  Supprimer
                </Button>
              )}
            </div>
            <div className="mt-2">
              <a
                href={`/circuit/${circuit.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/circuit/${circuit.id}`);
                }}
                className="text-[#2C5BA1] no-underline hover:underline flex items-center"
              >
                <i className="far fa-eye mr-1"></i>Voir Descriptif
              </a>
            </div>
            <div className="rounded-lg py-2 px-4 text-white bg-[#2C5BA1] font-semibold absolute bottom-0 right-0 flex items-center gap-1">
              <span className="text-sm font-normal">à partir de </span>
              <span className="font-bold">
                {circuit.price !== null && circuit.price !== undefined ? circuit.price : 'N/A'}
              </span>
              {circuit.price !== null && circuit.price !== undefined && (
                <>
                  <sup className="text-xs">DT</sup>
                  <sub className="text-xs">/per</sub>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircuitCard;