export default function StatCard({title,value,textColor = "text-white"}){
    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-gray-400 text-sm font-semibold uppercase">{title}</h3>
            <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
        </div>
    );
}