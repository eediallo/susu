"use client"

import { useState } from "react"
import { Inter } from "next/font/google"
import LandingPage from "@/components/landing-page"
import Dashboard from "@/components/dashboard"
import VaultDetails from "@/components/vault-details"
import Settings from "@/components/settings"
import CreateVaultModal from "@/components/create-vault-modal"
import DepositModal from "@/components/deposit-modal"
import NotificationsDropdown from "@/components/notifications-dropdown"

const inter = Inter({ subsets: ["latin"] })

export interface Vault {
  id: string
  name: string
  collected: number
  target: number
  members: string[]
  daysLeft: number
  status: string
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [currentPage, setCurrentPage] = useState<"dashboard" | "vault-details" | "settings">("dashboard")
  const [selectedVault, setSelectedVault] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [currency, setCurrency] = useState("USD")
  const [vaults, setVaults] = useState<Vault[]>([
    {
      id: "1",
      name: "Smith Family Vault",
      collected: 400,
      target: 500,
      members: ["A", "B", "C", "D"],
      daysLeft: 12,
      status: "Collecting",
    },
    {
      id: "2",
      name: "Emergency Fund",
      collected: 750,
      target: 1000,
      members: ["A", "B", "C"],
      daysLeft: 5,
      status: "Ready for Payout",
    },
    {
      id: "3",
      name: "Vacation Pool",
      collected: 200,
      target: 800,
      members: ["A", "B", "C", "D", "E"],
      daysLeft: 25,
      status: "Collecting",
    },
  ])

  const handleConnect = () => {
    setIsConnected(true)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setCurrentPage("dashboard")
    setSelectedVault(null)
  }

  const handleVaultClick = (vaultId: string) => {
    setSelectedVault(vaultId)
    setCurrentPage("vault-details")
  }

  const handleBackToDashboard = () => {
    setCurrentPage("dashboard")
    setSelectedVault(null)
  }

  const handleNavigateToSettings = () => {
    setCurrentPage("settings")
  }

  const handleCreateVault = (vaultData: any) => {
    const newVault: Vault = {
      id: (vaults.length + 1).toString(),
      name: vaultData.name,
      collected: 0,
      target:
        Number.parseInt(vaultData.amount) *
        (vaultData.addresses.split("\n").filter((addr: string) => addr.trim()).length + 1),
      members: [
        "You",
        ...vaultData.addresses
          .split("\n")
          .filter((addr: string) => addr.trim())
          .map((_: string, i: number) => String.fromCharCode(65 + i)),
      ],
      daysLeft: vaultData.frequency === "weekly" ? 7 : vaultData.frequency === "monthly" ? 30 : 90,
      status: "Collecting",
    }
    setVaults([...vaults, newVault])
    setShowCreateModal(false)
  }

  const handleDeposit = (amount: number) => {
    if (selectedVault) {
      setVaults(
        vaults.map((vault) => (vault.id === selectedVault ? { ...vault, collected: vault.collected + amount } : vault)),
      )
    }
    setShowDepositModal(false)
  }

  if (!isConnected) {
    return (
      <div className={inter.className}>
        <LandingPage onConnect={handleConnect} />
      </div>
    )
  }

  return (
    <div className={inter.className}>
      {currentPage === "dashboard" && (
        <Dashboard
          vaults={vaults}
          currency={currency}
          onCurrencyChange={setCurrency}
          onVaultClick={handleVaultClick}
          onDisconnect={handleDisconnect}
          onCreateVault={() => setShowCreateModal(true)}
          onNavigateToSettings={handleNavigateToSettings}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          showNotifications={showNotifications}
        />
      )}
      {currentPage === "vault-details" && selectedVault && (
        <VaultDetails
          vaultId={selectedVault}
          currency={currency}
          onBack={handleBackToDashboard}
          onDisconnect={handleDisconnect}
          onNavigateToSettings={handleNavigateToSettings}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          showNotifications={showNotifications}
          onOpenDeposit={() => setShowDepositModal(true)}
        />
      )}
      {currentPage === "settings" && (
        <Settings
          onBack={handleBackToDashboard}
          onDisconnect={handleDisconnect}
          onNavigateToSettings={handleNavigateToSettings}
          onToggleNotifications={() => setShowNotifications(!showNotifications)}
          showNotifications={showNotifications}
        />
      )}
      {showCreateModal && <CreateVaultModal onClose={() => setShowCreateModal(false)} onConfirm={handleCreateVault} />}
      {showDepositModal && <DepositModal onClose={() => setShowDepositModal(false)} onConfirm={handleDeposit} />}
      {showNotifications && <NotificationsDropdown onClose={() => setShowNotifications(false)} />}
    </div>
  )
}
