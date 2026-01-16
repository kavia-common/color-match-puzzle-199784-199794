import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Citrus Crush title", () => {
  render(<App />);
  const title = screen.getByText(/citrus crush/i);
  expect(title).toBeInTheDocument();
});
