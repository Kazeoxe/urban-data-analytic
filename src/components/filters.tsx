import { EarthquakeType } from "@/utils/earthquakeType";
import { useState } from "react";

interface FilterProps {
  setFilters: React.Dispatch<
    React.SetStateAction<{ startDate: string; endDate: string; place: string }>
  >;
  earthquakesData?: EarthquakeType[];
  onPlaceSelect?: (place: string) => void;
}

export const PlacesFilter: React.FC<FilterProps> = ({ setFilters, earthquakesData, onPlaceSelect }) => {
  const handlePlaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const place = event.target.value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      place,
    }));
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  return (
    <div className="mt-4 max-w-sm w-[85%] mx-auto">
      <label className="block mb-2 text-sm text-slate-800 font-bold">
        Select places
      </label>
      <div className="relative">
        <select
          title="places"
          className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded pl-3 pr-8 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer"
          onChange={handlePlaceChange}
        >
          {[...new Set((earthquakesData ?? []).map((earthquake) => earthquake.place))].map((place) => (
            <option key={place} value={place}>
              {place}
            </option>
          ))}
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.2"
          stroke="currentColor"
          className="h-5 w-5 ml-1 absolute top-2.5 right-2.5 text-slate-700"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
          />
        </svg>
      </div>
    </div>
  );
};

export const DateRangeFilter: React.FC<FilterProps> = ({ setFilters }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStartDate(event.target.value);
    setFilters((prevFilters) => ({
      ...prevFilters,
      startDate: event.target.value,
    }));
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
    setFilters((prevFilters) => ({
      ...prevFilters,
      endDate: event.target.value,
    }));
  };

  return (
    <div className="mt-8 rounded-lg  max-w-sm w-[85%] mx-auto">
      <h3 className="mb-2 text-xm font-bold text-slate-800 ">
        Select Date Range
      </h3>

      <div className="space-y-2">
        <div>
          <label
            htmlFor="start-date"
            className="block text-sm font-medium text-gray-600"
          >
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={handleStartDateChange}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="end-date"
            className="block text-sm font-medium text-gray-600"
          >
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={handleEndDateChange}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
