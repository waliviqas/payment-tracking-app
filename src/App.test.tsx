import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the SpendTracker header", () => {
  render(<App />);
  expect(screen.getByText(/SpendTracker/i)).toBeInTheDocument();
});
