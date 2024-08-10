using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Reflection;
using Microsoft.Data.SqlClient;


namespace TSPservice
{
    public class DBCommon
    {
        private class ProjectConfig
        {
            static string connectionString = "Data Source=localhost,1433;Initial Catalog=TrashManagerSystemDB;User ID=sa;Password=Admin@123;TrustServerCertificate=True;";
            static string connectionString_wan = "Data Source=tuanlocal.ddns.net,1433;Initial Catalog=Twitter;User ID=sa;Password=01224233775;";
            public static string ConnectionString { get => connectionString; set => connectionString = value; }
            public static string ConnectionString_WAN { get => connectionString_wan; set => connectionString_wan = value; }
        }
        public static int Insert<T>(T obj, List<string> listpropertiesinsert = null)
        {
            using (SqlConnection connection = new SqlConnection(ProjectConfig.ConnectionString))
            {
                Type objectType = typeof(T);
                TableAttribute tableAttribute = objectType.GetCustomAttribute<TableAttribute>();

                if (tableAttribute == null)
                {
                    throw new Exception("Table attribute not found.");
                }

                string tableName = tableAttribute.Name;

                PropertyInfo[] objectProperties = objectType.GetProperties();

                List<string> columnNamesList = new List<string>();
                List<string> valuePlaceholdersList = new List<string>();

                foreach (PropertyInfo property in objectProperties)
                {
                    string propertyName = property.Name;
                    string parameterName = $"@{propertyName}";
                    object parameterValue = property.GetValue(obj);
                    bool isIdColumn = propertyName.ToLower() == "id";

                    if ((listpropertiesinsert == null || listpropertiesinsert.Contains(propertyName)) && !isIdColumn && parameterValue != null)
                    {
                        columnNamesList.Add($"[{propertyName}]");
                        valuePlaceholdersList.Add(parameterName);
                    }
                }

                string columnNames = string.Join(", ", columnNamesList);
                string valuePlaceholders = string.Join(", ", valuePlaceholdersList);

                string insertQuery = $"INSERT INTO [{tableName}] ({columnNames}) VALUES ({valuePlaceholders}); SELECT SCOPE_IDENTITY();";

                connection.Open();

                using (SqlCommand insertCommand = new SqlCommand(insertQuery, connection))
                {
                    foreach (PropertyInfo property in objectProperties)
                    {
                        string propertyName = property.Name;
                        string parameterName = $"@{propertyName}";
                        object parameterValue = property.GetValue(obj);
                        bool isIdColumn = propertyName.ToLower() == "id";

                        if ((listpropertiesinsert == null || listpropertiesinsert.Contains(propertyName)) && !isIdColumn && parameterValue != null)
                        {
                            if (parameterName.ToLower() == "@modified")
                            {
                                insertCommand.Parameters.AddWithValue(parameterName, DateTime.Now);
                            }
                            else if (parameterName.ToLower() == "@created")
                            {
                                insertCommand.Parameters.AddWithValue(parameterName, DateTime.Now);
                            }
                            else
                            {
                                insertCommand.Parameters.AddWithValue(parameterName, parameterValue);
                            }
                        }
                    }

                    // Execute the insert query and retrieve the generated ID
                    int insertId = Convert.ToInt32(insertCommand.ExecuteScalar());

                    return insertId;
                }
            }
        }
        
        public static (List<T>, int) Selects<T>(int offset, int limit)
        {
            using (SqlConnection connection = new SqlConnection(ProjectConfig.ConnectionString))
            {
                Type objectType = typeof(T);
                TableAttribute tableAttribute = objectType.GetCustomAttribute<TableAttribute>();

                if (tableAttribute == null)
                {
                    throw new Exception("Table attribute not found.");
                }

                string tableName = tableAttribute.Name;

                PropertyInfo[] objectProperties = objectType.GetProperties();

                // Find the property with the [Key] attribute
                PropertyInfo keyProperty = objectProperties.FirstOrDefault(p => p.GetCustomAttribute<KeyAttribute>() != null);

                if (keyProperty == null)
                {
                    throw new Exception("Key attribute not found.");
                }

                string keyColumnName = keyProperty.Name;

                string selectQuery = $"SELECT * FROM [{tableName}] ORDER BY [{keyColumnName}] OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY";
                string countQuery = $"SELECT COUNT(*) FROM [{tableName}]";

                connection.Open();

                using (SqlCommand selectCommand = new SqlCommand(selectQuery, connection))
                using (SqlCommand countCommand = new SqlCommand(countQuery, connection))
                {
                    selectCommand.Parameters.AddWithValue("@Offset", offset);
                    selectCommand.Parameters.AddWithValue("@Limit", limit);

                    int totalCount = (int)countCommand.ExecuteScalar();

                    List<T> resultList = new List<T>();

                    using (SqlDataReader reader = selectCommand.ExecuteReader())
                    {
                        DataTable schemaTable = reader.GetSchemaTable();

                        while (reader.Read())
                        {
                            T obj = Activator.CreateInstance<T>();

                            foreach (PropertyInfo property in objectProperties)
                            {
                                string propertyName = property.Name;

                                if (HasColumn(schemaTable, propertyName) && !reader.IsDBNull(reader.GetOrdinal(propertyName)))
                                {
                                    object value = reader[propertyName];
                                    property.SetValue(obj, value);
                                }
                            }

                            resultList.Add(obj);
                        }
                    }

                    return (resultList, totalCount);
                }
            }
        }
        public static int Update<T>(T obj, List<string> listpropertiesupdate)
        {
            if (listpropertiesupdate == null)
            {
                throw new ArgumentNullException(nameof(listpropertiesupdate), "The listpropertiesupdate parameter cannot be null.");
            }

            using (SqlConnection connection = new SqlConnection(ProjectConfig.ConnectionString))
            {
                Type objectType = typeof(T);
                TableAttribute tableAttribute = objectType.GetCustomAttribute<TableAttribute>();

                if (tableAttribute == null)
                {
                    throw new Exception("Table attribute not found.");
                }

                string tableName = tableAttribute.Name;

                PropertyInfo[] objectProperties = objectType.GetProperties();

                string updateQuery = $"UPDATE [{tableName}] SET ";
                string whereQuery = "";
                List<string> updateExpressions = new List<string>();

                foreach (PropertyInfo property in objectProperties)
                {
                    string propertyName = property.Name;
                    string parameterName = $"@{propertyName}";
                    object parameterValue = property.GetValue(obj);
                    if (parameterValue != null)
                    {
                        if ((listpropertiesupdate.Contains(propertyName)) && propertyName.ToLower() != "id")
                        {
                            updateExpressions.Add($"[{propertyName}] = {parameterName}");
                            continue;
                        }
                        if (parameterName.ToLower() == "modified")
                        {
                            updateExpressions.Add($"[{propertyName}] = GETDATE()");
                            continue;
                        }
                        if (propertyName.ToLower() == "id")
                        {
                            whereQuery += $" WHERE [{propertyName}] = {parameterName}";
                            continue;
                        }
                    }

                }

                updateQuery += string.Join(", ", updateExpressions) + whereQuery;

                connection.Open();

                using (SqlCommand updateCommand = new SqlCommand(updateQuery, connection))
                {
                    foreach (PropertyInfo property in objectProperties)
                    {
                        string propertyName = property.Name;
                        string parameterName = $"@{propertyName}";
                        object parameterValue = property.GetValue(obj);

                        if ((listpropertiesupdate == null || listpropertiesupdate.Contains(propertyName)) && propertyName.ToLower() != "id")
                        {
                            if (parameterName.ToLower() != "@modified" && parameterName.ToLower() != "@created")
                            {
                                updateCommand.Parameters.AddWithValue(parameterName, parameterValue);
                            }
                        }

                        if (propertyName.ToLower() == "id")
                        {
                            updateCommand.Parameters.AddWithValue(parameterName, parameterValue);
                        }
                    }

                    int rowsAffected = updateCommand.ExecuteNonQuery();

                    return rowsAffected;
                }
            }
        }
        public static (DataTable, int) ExecuteStoredProcedure_GetList_TotalRecord(List<SqlParameter> sqlParameters, string storedProcedureName, int retryCount = 20)
        {
            DataTable dataTable = new DataTable();
            int totalCount = 0;
            // Create a connection to the database
            using (SqlConnection connection = new SqlConnection(ProjectConfig.ConnectionString))
            {
                // Open the connection
                connection.Open();

                // Create a command object for the stored procedure
                using (SqlCommand command = new SqlCommand(storedProcedureName, connection))
                {
                    command.Parameters.AddRange(sqlParameters.ToArray());
                    command.CommandTimeout = 5; // Set the command timeout to 5 seconds

                    // Set the command type as stored procedure
                    command.CommandType = CommandType.StoredProcedure;

                    // Create a data adapter to fill the DataTable
                    using (SqlDataAdapter adapter = new SqlDataAdapter(command))
                    {
                        // Retry the function upon timeout
                        for (int i = 0; i < retryCount; i++)
                        {
                            try
                            {
                                // Fill the DataTable with the result of the stored procedure
                                adapter.Fill(dataTable);
                                SqlParameter totalCountParameter = sqlParameters.FirstOrDefault(p => p.ParameterName == "@TotalRecord");
                                if (totalCountParameter != null)
                                {
                                    // The "@TotalCount" parameter exists in the sqlParameters list
                                    totalCount = Convert.ToInt32(totalCountParameter.Value);
                                    // Use the totalCount value as needed
                                    Console.WriteLine($"Total Count: {totalCount}");
                                }
                                // If the execution was successful, break out of the loop
                                break;
                            }
                            catch (SqlException ex)
                            {
                                // Check if the exception is due to a timeout
                                if (ex.Number == -2)
                                {
                                    // Print a message indicating the timeout
                                    Console.WriteLine($"Timeout occurred. Retrying... ({i + 1}/{retryCount})");

                                    // Sleep for a short duration before retrying
                                    Thread.Sleep(1000);
                                }
                                else
                                {
                                    // Rethrow the exception if it is not a timeout
                                    throw;
                                }
                            }
                        }
                    }
                }
            }

            return (dataTable, totalCount);
        }
        private static bool HasColumn(DataTable schemaTable, string columnName)
        {
            foreach (DataRow row in schemaTable.Rows)
            {
                string schemaColumnName = (string)row["ColumnName"];
                if (string.Equals(schemaColumnName, columnName, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
