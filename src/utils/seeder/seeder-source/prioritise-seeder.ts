import PriorityModel from "../../../database/priority/priority-db-model";
import { generatePrioritiesData } from "../data-source/priorities-data";
export const seedPriority = async () => {
    await PriorityModel.deleteMany({});
    const priorities = await generatePrioritiesData();
    await PriorityModel.insertMany(priorities);
};
