'use client';

import React, { useState, useMemo } from 'react';
import { Upload, Image, Filter, X } from 'lucide-react';

export default function ImageChecker() {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [groupBy, setGroupBy] = useState([]);
  const [filters, setFilters] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [error, setError] = useState('');

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          setError('CSV file is empty');
          return;
        }

        const headerLine = parseCSVLine(lines[0]);
        setHeaders(headerLine);
        
        const groupingCols = headerLine.filter(h => {
          const lower = h.toLowerCase();
          return !lower.includes('image') && 
                 !lower.includes('url') && 
                 !lower.includes('link');
        });
        setAvailableColumns(groupingCols);

        const data = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const row = {};
          headerLine.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setCsvData(data);
        setError('');
        setFilters({});
      } catch (err) {
        setError('Error parsing CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const toggleGroupBy = (column) => {
    setGroupBy(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const getUniqueValues = (column) => {
    const values = csvData.map(item => item[column]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearFilter = (column) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const filteredData = useMemo(() => {
    let filtered = csvData;
    
    Object.entries(filters).forEach(([column, value]) => {
      if (value) {
        filtered = filtered.filter(item => item[column] === value);
      }
    });
    
    return filtered;
  }, [csvData, filters]);

  const groupedData = useMemo(() => {
    if (groupBy.length === 0) {
      return { 'All Images': filteredData };
    }

    const grouped = {};
    filteredData.forEach(item => {
      const key = groupBy.map(col => `${col}: ${item[col]}`).join(' | ');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }, [filteredData, groupBy]);

  const getImageUrl = (item) => {
    const imageCol = headers.find(h => {
      const lower = h.toLowerCase();
      return lower.includes('image') || lower.includes('url') || lower.includes('link');
    });
    return imageCol ? item[imageCol] : '';
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (csvData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Image className="w-16 h-16 mx-auto text-indigo-600 mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Image Checker</h1>
              <p className="text-gray-600">Upload a CSV file to view and group your images</p>
            </div>

            <div className="border-2 border-dashed border-indigo-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors">
              <Upload className="w-12 h-12 mx-auto text-indigo-400 mb-4" />
              <label className="cursor-pointer">
                <span className="text-lg font-semibold text-indigo-600 hover:text-indigo-700">
                  Choose CSV File
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                CSV should contain image URLs and grouping columns
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Expected CSV Format:</h3>
              <pre className="text-sm text-gray-600 overflow-x-auto">
                Base Model,Product Name,Paint Description,VRM,Image URL{'\n'}
                Defender,Defender 110,Silicon Silver,KR25NXP,https://...{'\n'}
                Range Rover,RR VELAR,Carpathian Grey,KR25RHY,https://...
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">Image Checker</h1>
              <span className="text-sm text-gray-500">
                ({filteredData.length} of {csvData.length} images)
              </span>
            </div>
            <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Upload New CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-gray-700">
                <Filter className="w-5 h-5" />
                <span className="font-semibold">Filters:</span>
              </div>
              {availableColumns.map(col => (
                <div key={col} className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">{col}:</label>
                  <select
                    value={filters[col] || ''}
                    onChange={(e) => handleFilterChange(col, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All</option>
                    {getUniqueValues(col).map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                  {filters[col] && (
                    <button
                      onClick={() => clearFilter(col)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm px-3 py-1 text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {availableColumns.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap pt-2 border-t">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold">Group by:</span>
                </div>
                {availableColumns.map(col => (
                  <label key={col} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupBy.includes(col)}
                      onChange={() => toggleGroupBy(col)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {Object.entries(groupedData).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No images match the current filters</p>
          </div>
        ) : (
          Object.entries(groupedData).map(([groupName, items]) => (
            <div key={groupName} className="mb-12">
              {groupBy.length > 0 && (
                <div className="mb-6 pb-3 border-b-2 border-indigo-200">
                  <h2 className="text-2xl font-bold text-gray-800">{groupName}</h2>
                  <p className="text-sm text-gray-600 mt-1">{items.length} images</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {items.map((item, index) => {
                  const imageUrl = getImageUrl(item);
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={`https://corsproxy.io/?${encodeURIComponent(imageUrl)}`}
                            alt={`${item['Base Model']} - ${item['Product Name']}`}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              console.error('Image failed to load:', imageUrl);
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10"%3EImage%20Blocked%3C/text%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="8"%3Eby%20CSP%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <Image className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <div className="p-3">
                        {headers.filter(h => {
                          const lower = h.toLowerCase();
                          return !lower.includes('image') && 
                                 !lower.includes('url') && 
                                 !lower.includes('link');
                        }).map(header => (
                          <div key={header} className="text-xs mb-1 truncate" title={item[header]}>
                            <span className="font-semibold text-gray-600">{header}:</span>
                            <span className="text-gray-800 ml-1">{item[header]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
