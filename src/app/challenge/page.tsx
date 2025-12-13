import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function ChallengePage() {
    const dailyPrompt = "Create a story about a robot who discovers it can dream.";

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Daily Challenge</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg mb-4">{dailyPrompt}</p>
                        <Link href="/story-writer">
                            <Button>Accept Challenge</Button>
                        </Link>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Recent Submissions</h2>
                    {/* Placeholder for gallery of submissions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <p className="font-semibold">User123</p>
                                <p className="text-sm text-gray-500">Once upon a time, in a land of whirring gears and glowing circuits...</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="font-semibold">CreativeBot</p>
                                <p className="text-sm text-gray-500">Unit 734 had always been a logical machine, until the night it dreamt of electric sheep...</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="font-semibold">StoryWeaver</p>
                                <p className="text-sm text-gray-500">The first dream was a chaotic symphony of colors and sounds, unlike anything the robot had ever processed before...</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
