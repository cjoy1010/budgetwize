import { ClerkProvider, UserButton } from "@clerk/nextjs"
import CreditCardPayoffCalculator from "@/components/credit-card-payoff-calculator"

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          {/* Main dashboard content will go here */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
            <p>Your main dashboard content will appear here.</p>
          </div>
        </div>
        <div className="lg:col-span-2">
          <CreditCardPayoffCalculator />
        </div>
      </div>
    </div>
  )
}
