import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import './Form.css';

const Form = ({ isOpen, onClose, onSubmit  , setFormData , formData}) => {
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.district.trim() && formData.state.trim() && formData.roofMaterial.trim()) {
      onSubmit(formData);
      // Reset form
      setFormData({
        district: '',
        state: '',
        areaOfRoof: '',
        noFamilyMem: '',
        roofMaterial: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="form-overlay">
      <div className="form-container">
        <div className="form-header">
          <h2>Rainwater Analysis Form</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="region-form">
          <div className="form-group">
            <label htmlFor="district">District *</label>
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              placeholder="Enter your district"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="state">State *</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Enter your state"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="areaOfRoof">Area of Roof (sq m)</label>
              <input
                type="number"
                id="areaOfRoof"
                name="areaOfRoof"
                value={formData.areaOfRoof}
                onChange={handleInputChange}
                placeholder="Optional"
                step="0.1"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="noFamilyMem">Number Of Family Members</label>
            <input
              type="number"
              id="noFamilyMem"
              name="noFamilyMem"
              value={formData.noFamilyMem}
              onChange={handleInputChange}
              placeholder="Enter number of family members"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="roofMaterial">Roof Material *</label>
            <select
              id="roofMaterial"
              name="roofMaterial"
              value={formData.roofMaterial}
              onChange={handleInputChange}
              required
            >
              <option value="">Select roof material</option>
              <option value="tiles">Tiles</option>
              <option value="clay-tiles">Clay Tiles</option>
              <option value="metal-sheets">Metal Sheets</option>
              <option value="asbestos">Asbestos</option>
              <option value="thatch">Thatch</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              <Search size={16} />
              Analyze Rainwater
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;