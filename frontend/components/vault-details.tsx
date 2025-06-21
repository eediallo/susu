"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Link, DollarSign, LogOut, Clock, CheckCircle2, History } from "lucide-react"
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css"
import NotificationsDropdown from "./notifications-dropdown"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface VaultDetailsProps {
  vaultId: string
  currency: string
  onBack: () => void
  onDisconnect: () => void
  onNavigateToSettings: () => void
  onToggleNotifications: () => void
  showNotifications: boolean
  onOpenDeposit: () => void
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

const vaultData = {
  "1": {
    name: "Smith Family Vault",
    totalPot: 400,
    userContribution: 100,
    frequency: "Monthly",
    lockEnd: "June 30, 2025",
    rotationSchedule: [
      { id: "1", name: "Alice", address: "0xab...", payoutDate: "June 15, 2025", status: "Paid", contributionStatus: "Contributed" },
      { id: "2", name: "Bob", address: "0xcd...", payoutDate: "July 15, 2025", status: "Current", contributionStatus: "Outstanding" },
      { id: "3", name: "Charlie", address: "0xef...", payoutDate: "August 15, 2025", status: "Queued", contributionStatus: "Contributed" },
      { id: "4", name: "Zara (You)", address: "0x12...", payoutDate: "September 15, 2025", status: "Queued", contributionStatus: "Contributed" },
      { id: "5", name: "David", address: "0xgh...", payoutDate: "October 15, 2025", status: "Queued", contributionStatus: "Contributed" },
    ],
    activities: [
      { id: "1", text: "Alice (0xab...) deposited $100 USDC.", time: "2 hours ago" },
      { id: "2", text: "Payout rotation updated - Alice moved to current position.", time: "4 hours ago" },
      { id: "3", text: "Bob (0xcd...) joined the vault.", time: "1 day ago" },
      { id: "4", text: "Charlie (0xef...) deposited $100 USDC.", time: "2 days ago" },
      { id: "5", text: "Vault created successfully.", time: "3 days ago" },
    ],
  },
}

export default function VaultDetails({
  vaultId,
  currency,
  onBack,
  onDisconnect,
  onNavigateToSettings,
  onToggleNotifications,
  showNotifications,
  onOpenDeposit,
}: VaultDetailsProps) {
  const [rotationSchedule, setRotationSchedule] = useState(vaultData["1"].rotationSchedule)
  const [isActivityVisible, setIsActivityVisible] = useState(true)

  const vault = vaultData[vaultId as keyof typeof vaultData]

  if (!vault) {
    return <div>Vault not found</div>
  }

  const nextPayoutUser = rotationSchedule.find(member => member.status === "Current")
  const lastPayoutDate = rotationSchedule[rotationSchedule.length - 1].payoutDate
  const targetPot = vault.userContribution * rotationSchedule.length
  const collectedPot = vault.totalPot
  const percentage = (collectedPot / targetPot) * 100
  const outstandingContributions = rotationSchedule.filter(m => m.contributionStatus === 'Outstanding').length

  return (
    <div className="min-h-screen bg-white text-gray-900 flex relative">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-forest-500 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">SikaChain</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full justify-start mb-4 text-gray-600 hover:text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </nav>

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
        <div className={`grid ${isActivityVisible ? 'grid-cols-2' : 'grid-cols-1'} gap-8 h-full`}>
          {/* Column 1: Vault Information & Payout Schedule */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{vault.name}</h1>
                <Button onClick={() => setIsActivityVisible(!isActivityVisible)} variant="outline" size="icon">
                  <History className="w-5 h-5" />
                </Button>
              </div>

              <Card className="bg-white border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    {/* Total Pot Section */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-forest-500 mb-4">Total Pot</h3>
                      <div className="w-48 h-48 mx-auto">
                        <CircularProgressbarWithChildren
                          value={percentage}
                          styles={buildStyles({
                            pathColor: "#3A5A40",
                            trailColor: "#DAD7CD",
                          })}
                        >
                          <div className="text-center text-[#344E41]">
                            <div className="font-bold text-lg">{`$${collectedPot} / $${targetPot}`}</div>
                            <div className="text-sm">USDC</div>
                          </div>
                        </CircularProgressbarWithChildren>
                      </div>
                      <div className="pt-4">
                        <p className="text-gray-600">
                          <span className="font-bold text-orange-500">{outstandingContributions}</span> outstanding
                          contribution{outstandingContributions === 1 ? "" : "s"}.
                        </p>
                      </div>
                    </div>

                    {/* Vault Info & Deposit Section */}
                    <div className="flex flex-col justify-between">
                      <Card className="bg-gray-50 p-4 h-full">
                        <CardContent className="space-y-4 flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Your Contribution:</span>
                            <div className="font-bold text-forest-500">${vault.userContribution} USDC</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Payout Frequency:</span>
                            <span className="font-medium text-gray-800">{vault.frequency}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Vault Contract Expiring:</span>
                            <span className="font-medium text-gray-800">{lastPayoutDate}</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Button className="w-full bg-forest-500 hover:bg-forest-600 text-white py-3 mt-4" onClick={onOpenDeposit}>
                        <DollarSign className="w-5 h-5 mr-2" />
                        Deposit Funds
                      </Button>
                    </div>
                  </div>
                </CardContent>

                {nextPayoutUser && (
                  <>
                    <CardHeader className="border-t">
                      <CardTitle className="text-forest-500">Next Payout</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-forest-500 text-white text-xl">
                            {nextPayoutUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-lg text-gray-800">{nextPayoutUser.name}</div>
                          <p className="text-gray-600">
                            Payout on <span className="font-medium text-gray-800">{nextPayoutUser.payoutDate}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}

                <CardHeader className="border-t">
                  <CardTitle className="text-forest-500">Group Members</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rotationSchedule.map((member) => (
                      <Card
                        key={member.id}
                        className={`p-4 bg-gray-50 ${
                          member.status === "Current" ? "border-2 border-forest-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Avatar className="w-12 h-12 border-2 border-white">
                            <AvatarFallback className="bg-forest-500 text-white text-lg">{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {member.status === 'Paid' ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : (
                                  <Clock className="w-6 h-6 text-gray-400" />
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                {member.status === "Current" ? (
                                  <p>Current Recipient</p>
                                ) : (
                                  <p>Payout {member.status}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="mb-3">
                          <div className="font-bold text-gray-800">{member.name}</div>
                          <div className="text-xs text-gray-500">Payout on {member.payoutDate}</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-600 mb-1">Current cycle:</div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.contributionStatus === "Contributed"
                                ? "bg-green-500/20 text-green-600"
                                : "bg-orange-500/20 text-orange-600"
                            }`}
                          >
                            {member.contributionStatus}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Column 2: Activity Feed */}
          {isActivityVisible && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Recent Activity</h2>

              <Card className="bg-white border-gray-200 h-[600px] shadow-md">
                <CardContent className="p-0">
                  <ScrollArea className="h-full p-6">
                    <div className="space-y-4">
                      {vault.activities.map((activity) => (
                        <div key={activity.id} className="border-l-2 border-forest-500 pl-4 pb-4">
                          <div className="text-sm text-gray-700 mb-1">{activity.text}</div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && <NotificationsDropdown onClose={() => onToggleNotifications()} />}
    </div>
  )
}
