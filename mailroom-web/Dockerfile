FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Mailroom.csproj NuGet.Config ./
RUN dotnet restore Mailroom.csproj --configfile NuGet.Config
COPY Models.cs MailService.cs NetworkPolicy.cs SessionStore.cs Program.cs ./
COPY Web/ ./Web/
RUN dotnet publish Mailroom.csproj -c Release --no-restore -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out ./
USER $APP_UID
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "Mailroom.dll"]
