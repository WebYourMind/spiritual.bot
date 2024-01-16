import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import appConfig from "app.config";
import Card from "components/card";
import { Button } from "components/ui/button";
import { thinkingStyleDescriptions } from "lib/ArchetypePieChart";
import { Score } from "lib/quiz";
import { ThinkingStyle, UserProfile } from "lib/types";
import { capitalizeFirstLetter } from "lib/utils";
import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = [
  "#0088FE", // Blue
  "#00C49F", // Greenish
  "#FFBB28", // Yellow
  "#FF8042", // Orange
  "#a4de6c", // Light Green
  "#d0ed57", // Lime Green
  "#ffc658", // Gold
  "#A569BD", // Purple
];

type Props = {
  teamMembers: UserProfile[];
};

type ArchetypeKey = keyof Score;

export const CustomTooltip = ({ active, payload, teamMembers }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0] as { name: ThinkingStyle; value: string };
    const description = name in thinkingStyleDescriptions ? thinkingStyleDescriptions[name] : null;
    return (
      <div className="rounded-lg border bg-background p-2">
        <p className="font-bold">{name}</p>
        <p>
          {value} / {teamMembers.length * 100} point{parseFloat(value) > 1 && "s"}
        </p>
        <p className="text-sm">{description}</p>
      </div>
    );
  }

  return null;
};

const ThinkingStyleDistribution = ({ teamMembers }: Props) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate the distribution of thinking styles
  const styleCounts = teamMembers.reduce((acc: any, member: UserProfile) => {
    Object.keys(member.scores as Score).forEach((key: string) => {
      const capKey = capitalizeFirstLetter(key);
      acc[capKey] = (acc[capKey] || 0) + (member.scores as Score)[key as ArchetypeKey];
    });

    return acc;
  }, {});

  const data = Object.keys(styleCounts).map((key) => ({ name: key, value: styleCounts[key] }));
  const radarData = data.map((d) => ({ ...d, value: d.value / data.length }));

  return (
    <Card>
      <div className="flex h-[420px] flex-col items-center justify-between">
        <h2 className="mb-4 text-center text-2xl font-bold">Team Distribution</h2>
        {currentPage === 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis tickFormatter={(tick) => tick + "%"} />
              <Radar
                name="Team"
                dataKey="value"
                stroke={appConfig.theme.modes.light.primary}
                fill={appConfig.theme.modes.light.primary}
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <>
            <p className="text-muted">(Hover for more info)</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip teamMembers={teamMembers} />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
        <div className="flex w-full justify-between">
          <Button variant={"outline"} disabled={currentPage <= 0} onClick={() => setCurrentPage(currentPage - 1)}>
            <ArrowLeftIcon />
          </Button>
          <Button variant={"outline"} disabled={currentPage >= 1} onClick={() => setCurrentPage(currentPage + 1)}>
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ThinkingStyleDistribution;
