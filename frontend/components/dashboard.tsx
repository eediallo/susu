"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Vault, Bell, Settings, Link, Clock, Users, LogOut, Plus } from "lucide-react"
import type { Vault as VaultType } from "@/app/page"
import NotificationsDropdown from "./notifications-dropdown"

interface DashboardProps {
  vaults: VaultType[]
  currency: string
  onCurrencyChange: (currency: string) => void
  onVaultClick: (vaultId: string) => void
  onDisconnect: () => void
  onCreateVault: () => void
  onNavigateToSettings: () => void
  onToggleNotifications: () => void
  showNotifications: boolean
}

const currencyRates = {
  USD: 1,
  GBP: 0.79,
  NGN: 1650,
  KES: 129,
}

const currencySymbols = {
  USD: "$",
  GBP: "£",
  NGN: "₦",
  KES: "KSh",
}

function convertCurrency(amount: number, toCurrency: string): string {
  const converted = amount * currencyRates[toCurrency as keyof typeof currencyRates]
  const symbol = currencySymbols[toCurrency as keyof typeof currencySymbols]

  if (toCurrency === "NGN" || toCurrency === "KES") {
    return `${symbol}${Math.round(converted).toLocaleString()}`
  }
  return `${symbol}${Math.round(converted)}`
}

export default function Dashboard({
  vaults,
  currency,
  onCurrencyChange,
  onVaultClick,
  onDisconnect,
  onCreateVault,
  onNavigateToSettings,
  onToggleNotifications,
  showNotifications,
}: DashboardProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex relative">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-forest-500 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">SikaChain</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-forest-500/20 text-forest-600 border-l-4 border-forest-500">
                <Home className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </div>
            </li>
            <li>
              <div
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"
                onClick={() => {}} // Already on dashboard
              >
                <Vault className="w-5 h-5" />
                <span>My Vaults</span>
              </div>
            </li>
            <li>
              <div
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"
                onClick={onToggleNotifications}
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </div>
            </li>
            <li>
              <div
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"
                onClick={onNavigateToSettings}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </div>
            </li>
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-forest-500 text-white">U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">0x1234...abcd</div>
            </div>
          </div>
          <Button
            onClick={onDisconnect}
            variant="outline"
            size="sm"
            className="w-full bg-transparent border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-forest-500">Welcome Back!</h1>
          <Button onClick={onCreateVault} className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-2">
            <Plus className="w-5 h-5 mr-2" />
            Create a New Vault
          </Button>
        </div>

        {/* Vaults Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-forest-500">Your Active Vaults</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Display Currency:</span>
              <Select value={currency} onValueChange={onCurrencyChange}>
                <SelectTrigger className="w-20 bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault) => (
              <Card
                key={vault.id}
                className="bg-white border-gray-200 border-l-4 border-l-forest-500 cursor-pointer hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg"
                onClick={() => onVaultClick(vault.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">{vault.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vault.status === "Ready for Payout"
                          ? "bg-green-500/20 text-green-600"
                          : "bg-yellow-500/20 text-yellow-600"
                      }`}
                    >
                      {vault.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <div className="text-right">
                        <div className="text-forest-500 font-medium">
                          ${vault.collected} / ${vault.target}
                        </div>
                        {currency !== "USD" && (
                          <div className="text-xs text-gray-400">
                            ≈ {convertCurrency(vault.collected, currency)} / {convertCurrency(vault.target, currency)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Progress value={(vault.collected / vault.target) * 100} className="h-2 bg-gray-200" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {vault.members.map((member, index) => (
                        <Avatar key={index} className="w-8 h-8 border-2 border-white">
                          <AvatarFallback className="bg-forest-500 text-white text-xs">{member}</AvatarFallback>
                        </Avatar>
                      ))}
                      <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Payout in {vault.daysLeft} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && <NotificationsDropdown onClose={() => onToggleNotifications()} />}
    </div>
  )
}
